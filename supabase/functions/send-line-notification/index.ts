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
  event_type: "Submitted" | "Approved" | "Rejected" | "Cancelled";
  status: "Queued" | "Sent" | "Failed";
  foreign_teacher_leave_applications: {
    application_no: string;
    leave_type: string;
    reason: string;
    teacher_id: string;
    start_at: string;
    end_at: string;
    total_hours: number;
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
      .select("id, application_id, recipient_type, recipient_ref, event_type, status, foreign_teacher_leave_applications(application_no, leave_type, reason, teacher_id, start_at, end_at, total_hours)")
      .eq("id", notificationId)
      .single();
    if (notificationError || !notification) {
      console.error("[send-line-notification] Notification lookup failed", { notificationId, error: notificationError });
      return json({ error: notificationError?.message || "Notification not found", details: notificationError?.details, hint: notificationError?.hint }, 404);
    }

    const row = notification as unknown as NotificationRow;
    const { data: profile } = await supabaseAdmin.from("foreign_teacher_profiles").select("role").eq("user_id", userData.user.id).single();
    const isAdmin = ["admin", "cingshan", "dongyuan"].includes(profile?.role ?? "");
    if (!isAdmin && row.foreign_teacher_leave_applications.teacher_id !== userData.user.id) return json({ error: "Forbidden" }, 403);
    if (row.status === "Sent") return json({ ok: true, status: "Sent" });

    if (row.event_type !== "Submitted" && row.event_type !== "Cancelled" || row.recipient_type !== "SchoolMailbox") {
      await supabaseAdmin.from("foreign_teacher_leave_notifications").update({ status: "Sent", sent_at: new Date().toISOString(), error_message: null }).eq("id", row.id);
      return json({ ok: true, status: "Skipped", reason: "Only submissions and cancellations are pushed to school groups" });
    }
    const recipientId = await resolveRecipientId(row);
    console.log("[send-line-notification] Resolved LINE group", { notificationId, school: row.recipient_ref, recipientId, eventType: row.event_type });
    const { data: teacherProfile } = await supabaseAdmin.from("foreign_teacher_profiles").select("name").eq("user_id", row.foreign_teacher_leave_applications.teacher_id).maybeSingle();
    const application = row.foreign_teacher_leave_applications;
    const teacherName = teacherProfile?.name || "外籍教師";
    const dateRange = `${formatDate(application.start_at)} ~ ${formatDate(application.end_at)}`;
    const message = row.event_type === "Cancelled"
      ? `⚠️ 外師已取消請假申請\n姓名：${teacherName}\n學校：${row.recipient_ref}\n申請編號：${application.application_no}\n假別：${application.leave_type}\n日期：${dateRange}\n時數：${application.total_hours} 小時\n事由：${application.reason}`
      : `外師請假通知\n姓名：${teacherName}\n學校：${row.recipient_ref}\n申請編號：${application.application_no}\n假別：${application.leave_type}\n日期：${dateRange}\n時數：${application.total_hours} 小時\n事由：${application.reason}\n狀態：${row.event_type}`;
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { Authorization: `Bearer ${lineToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: recipientId, messages: [{ type: "text", text: message }] }),
    });
    console.log("[send-line-notification] LINE API response", { notificationId, status: lineResponse.status, ok: lineResponse.ok });
    if (!lineResponse.ok) {
      const responseBody = await lineResponse.text();
      console.error("[send-line-notification] LINE push failed", { notificationId, status: lineResponse.status, responseBody });
      throw new Error(`LINE push failed (${lineResponse.status}): ${responseBody}`);
    }

    await supabaseAdmin.from("foreign_teacher_leave_notifications").update(sentNotificationUpdate(new Date().toISOString())).eq("id", row.id);
    return json({ ok: true, status: "Sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-line-notification] Unhandled notification error", { notificationId, error });
    if (notificationId) await supabaseAdmin.from("foreign_teacher_leave_notifications").update(failedNotificationUpdate(message)).eq("id", notificationId);
    return json({ error: message, notification_id: notificationId }, 500);
  }
});

async function resolveRecipientId(row: NotificationRow) {
  if (row.recipient_type !== "SchoolMailbox") throw new Error("Teacher LINE notifications are disabled");
  const configured = await supabaseAdmin.from("foreign_teacher_line_group_settings").select("group_id").eq("school", row.recipient_ref).maybeSingle();
  if (configured.error) console.error("[send-line-notification] Group settings lookup failed", { school: row.recipient_ref, error: configured.error });
  if (!configured.error && configured.data?.group_id) {
    console.log("[send-line-notification] Using database LINE group", { school: row.recipient_ref, groupId: configured.data.group_id });
    return configured.data.group_id;
  }
  const envName = row.recipient_ref === "青山國小" ? "CINGSHAN_LINE_GROUP_ID" : "DONGYUAN_LINE_GROUP_ID";
  const id = Deno.env.get(envName);
  if (id) {
    console.log("[send-line-notification] Using environment LINE group fallback", { school: row.recipient_ref, envName, groupId: id });
    return id;
  }
  console.error("[send-line-notification] No LINE group configured", { school: row.recipient_ref, envName });
  throw new Error(`${envName} is not configured for ${row.recipient_ref}`);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
