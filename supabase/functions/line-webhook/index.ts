import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-line-signature",
};
const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");
  const secret = Deno.env.get("LINE_CHANNEL_SECRET");
  if (!signature || !secret) return json({ error: "Webhook verification is not configured" }, 401);
  if (!(await verifySignature(rawBody, signature, secret))) return json({ error: "Invalid signature" }, 401);

  const payload = JSON.parse(rawBody) as { events?: Array<{ type?: string; webhookEventId?: string; source?: { userId?: string; groupId?: string }; message?: { type?: string; text?: string } }> };
  const events = payload.events ?? [];
  for (const event of events) {
    if (!event.webhookEventId) continue;
    const sourceUserId = event.source?.userId ?? null;
    const sourceGroupId = event.source?.groupId ?? null;
    const bindCode = event.message?.type === "text" ? event.message.text?.trim().match(/^\\/bind\\s+(\\S+)$/)?.[1] : undefined;
    if (bindCode && (sourceUserId || sourceGroupId)) {
      const binding = await supabaseAdmin.from("line_recipient_bindings").select("id, profile_user_id, school").eq("binding_code", bindCode).is("used_at", null).maybeSingle();
      if (!binding.error && binding.data) {
        if (binding.data.profile_user_id && sourceUserId) {
          await supabaseAdmin.from("profiles").update({ line_user_id: sourceUserId, updated_at: new Date().toISOString() }).eq("user_id", binding.data.profile_user_id);
        }
        await supabaseAdmin.from("line_recipient_bindings").update({ line_user_id: sourceUserId, line_group_id: sourceGroupId, used_at: new Date().toISOString() }).eq("id", binding.data.id);
      }
    }
    await supabaseAdmin.from("line_webhook_events").upsert({
      webhook_event_id: event.webhookEventId,
      event_type: event.type ?? "unknown",
      line_user_id: sourceUserId,
      line_group_id: sourceGroupId,
      payload: event,
    }, { onConflict: "webhook_event_id" });
  }
  return json({ ok: true });
});

export async function verifySignature(body: string, signature: string, channelSecret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(channelSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
