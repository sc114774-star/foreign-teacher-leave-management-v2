import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lineToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type NotifyPayload = {
  action?: "submit" | "cancel" | string;
  school?: string;
  teacherName?: string;
  leaveDate?: string; // single date or a "start ~ end" style range, already formatted or ISO
  leaveType?: string;
  applicationNo?: string;
  totalHours?: number | string;
  reason?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // --- Auth: verify the caller has a valid Supabase session token ---
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

    // --- Parse payload ---
    let payload: NotifyPayload;
    try {
      payload = (await request.json()) as NotifyPayload;
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { action, school, teacherName, leaveDate, leaveType, applicationNo, totalHours, reason } = payload;

    if (!school) {
      return json({ success: false, error: "school is required" }, 400);
    }
    if (!lineToken) {
      console.error("[send-line-notification] LINE_CHANNEL_ACCESS_TOKEN is not configured");
      return json({ success: false, error: "LINE notification is not configured" }, 200);
    }

    // --- Resolve LINE group id for the school ---
    let recipientId: string | undefined;
    try {
      recipientId = await resolveRecipientId(school);
    } catch (resolveError) {
      const msg = resolveError instanceof Error ? resolveError.message : "Unknown error";
      console.error("[send-line-notification] Failed to resolve LINE group", { school, error: msg });
      return json({ success: false, error: `LINE notification failed: ${msg}` }, 200);
    }

    // --- Build message ---
    const isCancel = action === "cancel";
    const name = teacherName || "外籍教師";
    const dateText = leaveDate ? formatMaybeDate(leaveDate) : "未提供";
    const lines = [
      isCancel ? "⚠️ 外師已取消請假申請" : "外師請假通知",
      `姓名：${name}`,
      `學校：${school}`,
    ];
    if (applicationNo) lines.push(`申請編號：${applicationNo}`);
    if (leaveType) lines.push(`假別：${leaveType}`);
    lines.push(`日期：${dateText}`);
    if (totalHours !== undefined && totalHours !== null && totalHours !== "") {
      lines.push(`時數：${totalHours} 小時`);
    }
    if (reason) lines.push(`事由：${reason}`);
    const message = lines.join("\n");

    // --- Direct, synchronous push to LINE ---
    let lineResponse: Response;
    try {
      lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lineToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: recipientId, messages: [{ type: "text", text: message }] }),
      });
    } catch (networkError) {
      // fetch itself threw (network-level failure) — do NOT 500, degrade gracefully
      const msg = networkError instanceof Error ? networkError.message : "Unknown network error";
      console.error("[send-line-notification] Network error calling LINE API", { school, recipientId, error: msg });
      return json({ success: false, error: `LINE notification failed: ${msg}` }, 200);
    }

    if (!lineResponse.ok) {
      const responseBody = await lineResponse.text();
      console.error("[send-line-notification] LINE push failed", {
        school,
        recipientId,
        status: lineResponse.status,
        statusText: lineResponse.statusText,
        responseBody,
      });
      return json(
        { success: false, error: "LINE notification failed", status: lineResponse.status, detail: responseBody },
        200,
      );
    }

    console.log("[send-line-notification] LINE push sent", { school, recipientId, action });
    return json({ success: true }, 200);
  } catch (error) {
    // Final safety net: never let this function 500 the frontend's main flow.
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-line-notification] Unhandled error", { error: message });
    return json({ success: false, error: `LINE notification failed: ${message}` }, 200);
  }
});

async function resolveRecipientId(school: string): Promise<string> {
  // Prefer a DB-configured group id if you keep a settings table; falls back to env vars.
  const configured = await supabaseAdmin
    .from("foreign_teacher_line_group_settings")
    .select("group_id")
    .eq("school", school)
    .maybeSingle();

  if (configured.error) {
    console.error("[send-line-notification] Group settings lookup failed", { school, error: configured.error });
  }
  if (!configured.error && configured.data?.group_id) {
    return configured.data.group_id as string;
  }

  const envName = school === "青山國小" ? "CINGSHAN_LINE_GROUP_ID" : "DONGYUAN_LINE_GROUP_ID";
  const id = Deno.env.get(envName);
  if (!id) {
    throw new Error(`${envName} is not configured for ${school}`);
  }
  return id;
}

function formatMaybeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value; // already a formatted string, e.g. "2026-09-20 ~ 2026-09-21"
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
