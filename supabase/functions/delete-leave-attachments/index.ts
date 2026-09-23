import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = "foreign-teacher-leave-attachments";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify the caller is a signed-in Supabase user. We don't re-check
    // application ownership here: by the time this is called, the RPC that
    // returned these storage_keys has already deleted the application (and
    // confirmed ownership) inside the same transaction.
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Missing authorization" }, 401);
    }
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.slice("Bearer ".length),
    );
    if (authError || !userData.user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    let body: { storage_keys?: string[] };
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const storageKeys = Array.isArray(body.storage_keys) ? body.storage_keys.filter(Boolean) : [];
    if (storageKeys.length === 0) {
      return json({ success: true, removed: 0 }, 200);
    }

    // Uses the Storage API (service role) rather than raw SQL, so it isn't
    // blocked by the "Direct deletion from storage tables" guard and it
    // cleans up the actual file blob, not just the metadata row.
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).remove(storageKeys);
    if (error) {
      console.error("[delete-leave-attachments] Storage removal failed", { storageKeys, error });
      // Best-effort cleanup: the leave application row is already gone by
      // this point, so we don't want a storage hiccup to surface as an
      // error the user has to deal with. Log it for follow-up instead.
      return json({ success: false, error: error.message }, 200);
    }

    console.log("[delete-leave-attachments] Removed attachments", { count: data?.length ?? 0 });
    return json({ success: true, removed: data?.length ?? 0 }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[delete-leave-attachments] Unhandled error", { error: message });
    return json({ success: false, error: message }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
