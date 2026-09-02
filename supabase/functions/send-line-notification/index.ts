import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { failedNotificationUpdate, sentNotificationUpdate } from "../_shared/notificationStatus.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lineToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type NotificationRow = {
  id: number;
  application_id: number;
  recipient_type: "SchoolMailbox" | "Teacher";
  recipient_ref: string;
  event_type: "Submitted" | "Approved" | "Rejected";
  status: "Queued" | "Sent" | "Failed";
  foreign_teacher_leave_applications: {
    application_no: string;
    leave_type: string;
    reason: string;
    teacher_id: string;
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let notificationId: number | undefined;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);
    const { data: userData } = await supabaseAdmin.auth.getUser(authHeader.slice("Bearer ".length));
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json() as { notification_id?: number };
    notificationId = body.notification_id;
    if (!notificationId) return json({ error: "notification_id is required" }, 400);
    if (!lineToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");

    const { data: notification, error: notificationError } = await supabaseAdmin
      .from("foreign_teacher_leave_notifications")
      .select("id, application_id, recipient_type, recipient_ref, event_type, status, foreign_teacher_leave_applications(application_no, leave_type, reason, teacher_id)")
      .eq("id", notificationId)
      .single();
    if (notificationError || !notification) return json({ error: "Notification not found" }, 404);

    const row = notification as unknown as NotificationRow;
    const { data: profile } = await supabaseAdmin.from("foreign_teacher_profiles").select("role").eq("user_id", userData.user.id).single();
    const isAdmin = ["admin", "cingshan", "dongyuan"].includes(profile?.role ?? "");
    if (!isAdmin && row.foreign_teacher_leave_applications.teacher_id !== userData.user.id) return json({ error: "Forbidden" }, 403);
    if (row.status === "Sent") return json({ ok: true, status: "Sent" });

    const recipientId = await resolveRecipientId(row);
    const message = `外師請假通知\n申請編號：${row.foreign_teacher_leave_applications.application_no}\n假別：${row.foreign_teacher_leave_applications.leave_type}\n事由：${row.foreign_teacher_leave_applications.reason}\n狀態：${row.event_type}`;
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { Authorization: `Bearer ${lineToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: recipientId, messages: [{ type: "text", text: message }] }),
    });
    if (!lineResponse.ok) throw new Error(`LINE push failed (${lineResponse.status}): ${await lineResponse.text()}`);

    await supabaseAdmin.from("foreign_teacher_leave_notifications").update(sentNotificationUpdate(new Date().toISOString())).eq("id", row.id);
    return json({ ok: true, status: "Sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (notificationId) await supabaseAdmin.from("foreign_teacher_leave_notifications").update(failedNotificationUpdate(message)).eq("id", notificationId);
    return json({ error: message }, 500);
  }
});

async function resolveRecipientId(row: NotificationRow) {
  if (row.recipient_type === "Teacher") return row.recipient_ref;
  const binding = await supabaseAdmin.from("foreign_teacher_line_recipient_bindings").select("line_user_id, line_group_id").eq("school", row.recipient_ref).not("used_at", "is", null).order("used_at", { ascending: false }).limit(1).maybeSingle();
  if (!binding.error && binding.data) {
    const boundId = binding.data.line_group_id ?? binding.data.line_user_id;
    if (boundId) return boundId;
  }
  if (row.recipient_ref === "青山國小") {
    const id = Deno.env.get("LINE_CINGSHAN_RECIPIENT_ID");
    if (id) return id;
  }
  if (row.recipient_ref === "東原國中") {
    const id = Deno.env.get("LINE_DONGYUAN_RECIPIENT_ID");
    if (id) return id;
  }
  throw new Error(`LINE recipient is not configured for ${row.recipient_ref}`);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
