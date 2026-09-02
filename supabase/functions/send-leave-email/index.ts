import nodemailer from "npm:nodemailer@7.0.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let notificationId: number | undefined;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);
    const { data: userData } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json() as { notification_id?: number };
    notificationId = body.notification_id;
    if (!notificationId) return json({ error: "notification_id is required" }, 400);
    const { data: notification, error: notificationError } = await supabaseAdmin.from("leave_notifications").select("id, application_id, recipient_type, recipient_ref, event_type, status, leave_applications(application_no, leave_type, reason, start_at, end_at, teacher_id)").eq("id", body.notification_id).single();
    if (notificationError || !notification) return json({ error: "Notification not found" }, 404);

    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("user_id", userData.user.id).single();
    const isAdmin = profile?.role === "admin" || profile?.role === "cingshan" || profile?.role === "dongyuan";
    const application = notification.leave_applications as { teacher_id: string; application_no: string; leave_type: string; reason: string; start_at: string; end_at: string };
    if (!isAdmin && application.teacher_id !== userData.user.id) return json({ error: "Forbidden" }, 403);
    if (notification.status === "Sent") return json({ ok: true, status: "Sent" });

    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_APP_PASSWORD");
    if (!smtpUser || !smtpPassword) throw new Error("SMTP secrets are not configured");
    const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: smtpUser, pass: smtpPassword } });
    const isSubmitted = notification.event_type === "Submitted";
    const to = notification.recipient_ref;
    const subject = `${notification.event_type === "Approved" ? "Your leave has been approved · 您的假單已核准" : notification.event_type === "Rejected" ? "Leave application update · 假單審核結果" : "New leave application · 新請假申請"} ${application.application_no}`;
    await transport.sendMail({ from: `Foreign Teacher Leave Office <${smtpUser}>`, to, subject, text: `申請編號 Application No.：${application.application_no}\n假別 Type：${application.leave_type}\n事由 Reason：${application.reason}\n事件 Event：${notification.event_type}` });
    await transport.close();
    await supabaseAdmin.from("leave_notifications").update({ status: "Sent", sent_at: new Date().toISOString(), error_message: null }).eq("id", notification.id);
    return json({ ok: true, status: "Sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (notificationId) await supabaseAdmin.from("leave_notifications").update({ status: "Failed", error_message: message }).eq("id", notificationId);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
