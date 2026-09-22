import { supabase } from "./supabase";

export type SupabaseLeaveApplication = {
  id: number;
  application_no: string;
  teacher_id: string;
  leave_type: "PTO" | "Sick Leave" | "Personal Leave" | "Official Leave" | "Make-up Leave";
  reason: string;
  official_document_no: string | null;
  official_location: string | null;
  start_at: string;
  end_at: string;
  total_hours: number;
  substitute_name?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  created_at: string;
  updated_at: string;
  foreign_teacher_leave_days?: SupabaseLeaveDay[];
  foreign_teacher_leave_attachments?: SupabaseLeaveAttachment[];
};

export type SupabaseLeaveDay = { id: number; application_id: number; leave_date: string; hours: number; assigned_school: "青山國小" | "東原國中"; route_reason: string };
export type SupabaseLeaveAttachment = { id: number; application_id: number; file_name: string; mime_type: string; uploaded_at: string };
export type SupabaseLeaveBalance = { id: number; teacher_id: string; academic_year: string; leave_type: SupabaseLeaveApplication["leave_type"]; total_hours: number; approved_used_hours: number };
export type SupabasePtoSetting = { id: number; teacher_id: string; academic_year: string; total_days: number; updated_by: string; created_at: string; updated_at: string };
export type SupabaseTeacherProfile = { user_id: string; name: string | null; email: string | null; role: "teacher" | "cingshan" | "dongyuan" | "admin" };
export type SupabaseLoginProfile = Pick<SupabaseTeacherProfile, "user_id" | "name" | "email" | "role">;
export type SupabaseMakeupDay = { id: number; academic_year: string; makeup_date: string; source_date: string | null; assigned_school: "青山國小" | "東原國中"; note: string | null; created_by: string; created_at: string; updated_at: string };
export type SupabaseLineGroupSetting = { school: "青山國小" | "東原國中"; group_id: string; updated_by: string; updated_at: string };
export type SupabaseSubstitute = { id: number; school: "青山國小" | "東原國中"; name: string; created_by: string; created_at: string; updated_at: string };
export type SupabaseLeaveDecision = { application_id: number; school: "青山國小" | "東原國中"; decision: "Approved" | "Rejected"; note?: string };
export type SupabaseSignedAttachment = { id: number; file_name: string; mime_type: string; url: string };

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function fetchSupabaseLeaveApplications() {
  const client = requireClient();
  const result = await client.from("foreign_teacher_leave_applications").select("*, foreign_teacher_leave_days(*), foreign_teacher_leave_attachments(id, application_id, file_name, mime_type, uploaded_at)").order("created_at", { ascending: false });
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseLeaveApplication[];
}

export async function fetchSupabaseBalances(academicYear: string) {
  const client = requireClient();
  const result = await client.from("foreign_teacher_leave_balances").select("*").eq("academic_year", academicYear);
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseLeaveBalance[];
}

export async function fetchSupabaseMakeupDays(school?: "青山國小" | "東原國中") {
  const client = requireClient();
  let query = client.from("foreign_teacher_makeup_days").select("*").order("makeup_date", { ascending: true });
  if (school) query = query.eq("assigned_school", school);
  const result = await query;
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseMakeupDay[];
}

export async function upsertSupabaseMakeupDay(input: { academicYear: string; date: string; sourceDate?: string; school: "青山國小" | "東原國中"; note?: string }) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Supabase Auth session is required");
  const result = await client.from("foreign_teacher_makeup_days").upsert({ academic_year: input.academicYear, makeup_date: input.date, source_date: input.sourceDate ?? null, assigned_school: input.school, note: input.note ?? null, created_by: auth.user.id, updated_at: new Date().toISOString() }, { onConflict: "academic_year,makeup_date,assigned_school" }).select("*").single();
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseMakeupDay;
}

export async function deleteSupabaseMakeupDay(input: { academicYear: string; date: string; school: "青山國小" | "東原國中" }) {
  const client = requireClient();
  const result = await client.from("foreign_teacher_makeup_days").delete().eq("academic_year", input.academicYear).eq("makeup_date", input.date).eq("assigned_school", input.school);
  if (result.error) throw result.error;
}

export async function fetchSupabaseLineGroupSettings() {
  const client = requireClient();
  const result = await client.from("foreign_teacher_line_group_settings").select("school, group_id, updated_by, updated_at").order("school", { ascending: true });
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseLineGroupSetting[];
}

export async function fetchSupabaseSubstitutes(school?: "青山國小" | "東原國中") {
  const client = requireClient();
  let query = client.from("foreign_teacher_substitutes").select("*").order("school", { ascending: true }).order("name", { ascending: true });
  if (school) query = query.eq("school", school);
  const result = await query;
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseSubstitute[];
}

export async function upsertSupabaseSubstitute(input: { id?: number; school: "青山國小" | "東原國中"; name: string }) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Supabase Auth session is required");
  const payload = { ...(input.id ? { id: input.id } : {}), school: input.school, name: input.name.trim(), created_by: auth.user.id, updated_at: new Date().toISOString() };
  const result = await client.from("foreign_teacher_substitutes").upsert(payload).select("*").single();
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseSubstitute;
}

export async function deleteSupabaseSubstitute(id: number) {
  const client = requireClient();
  const result = await client.from("foreign_teacher_substitutes").delete().eq("id", id);
  if (result.error) throw result.error;
}

export async function upsertSupabaseLineGroupSetting(input: { school: "青山國小" | "東原國中"; groupId: string }) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Supabase Auth session is required");
  const result = await client.from("foreign_teacher_line_group_settings").upsert({ school: input.school, group_id: input.groupId, updated_by: auth.user.id }, { onConflict: "school" }).select("school, group_id, updated_by, updated_at").single();
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseLineGroupSetting;
}

export async function fetchSupabaseTeacherProfiles() {
  const client = requireClient();
  const result = await client.from("foreign_teacher_profiles").select("user_id, name, email, role").eq("role", "teacher").order("name", { ascending: true });
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseTeacherProfile[];
}

export async function fetchSupabaseLoginProfiles() {
  const client = requireClient();
  const result = await client
    .from("foreign_teacher_profiles")
    .select("user_id, name, email, role")
    .in("role", ["teacher", "cingshan", "dongyuan"])
    .not("email", "is", null)
    .order("name", { ascending: true });
  if (result.error) throw result.error;
  return result.data as unknown as SupabaseLoginProfile[];
}

export async function fetchSupabasePtoSettings(academicYear: string, teacherId?: string) {
  const client = requireClient();
  let query = client.from("foreign_teacher_pto_settings").select("*").eq("academic_year", academicYear);
  if (teacherId) query = query.eq("teacher_id", teacherId);
  const result = await query.order("teacher_id", { ascending: true });
  if (result.error) throw result.error;
  return result.data as unknown as SupabasePtoSetting[];
}

export async function upsertSupabasePtoSetting(input: { teacherId: string; academicYear: string; totalDays: number }) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Supabase Auth session is required");
  const result = await client.from("foreign_teacher_pto_settings").upsert({ teacher_id: input.teacherId, academic_year: input.academicYear, total_days: input.totalDays, updated_by: auth.user.id }, { onConflict: "teacher_id,academic_year" }).select("*").single();
  if (result.error) throw result.error;
  return result.data as unknown as SupabasePtoSetting;
}

export async function getSupabaseAttachmentUrl(applicationId: number, attachmentId: number, expiresIn = 300): Promise<SupabaseSignedAttachment> {
  const client = requireClient();
  const attachment = await client.from("foreign_teacher_leave_attachments").select("id, file_name, mime_type, storage_key").eq("id", attachmentId).eq("application_id", applicationId).single();
  if (attachment.error) throw attachment.error;
  const signed = await client.storage.from("foreign-teacher-leave-attachments").createSignedUrl(attachment.data.storage_key, expiresIn);
  if (signed.error) throw signed.error;
  return { id: attachment.data.id, file_name: attachment.data.file_name, mime_type: attachment.data.mime_type, url: signed.data.signedUrl };
}

export async function decideSupabaseLeaveApplication(input: SupabaseLeaveDecision) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Supabase Auth session is required");
  const days = await client.from("foreign_teacher_leave_days").select("assigned_school").eq("application_id", input.application_id);
  if (days.error) throw days.error;
  if (!days.data.length || days.data.some((day) => day.assigned_school !== input.school)) throw new Error("Application is not assigned to this school");
  const update = await client.from("foreign_teacher_leave_applications").update({ status: input.decision }).eq("id", input.application_id).eq("status", "Pending");
  if (update.error) throw update.error;
  const approvalTable = client.from("foreign_teacher_leave_approvals");
  const approvalPayload = { application_id: input.application_id, school: input.school, approver_id: auth.user.id, decision: input.decision, note: input.note ?? null };
  const approval = typeof (approvalTable as { upsert?: unknown }).upsert === "function"
    ? await (approvalTable as typeof approvalTable & { upsert: (payload: typeof approvalPayload, options: { onConflict: string }) => Promise<{ error: Error | null }> }).upsert(approvalPayload, { onConflict: "application_id,school" })
    : await approvalTable.insert(approvalPayload);
  if (approval.error) throw approval.error;
  return { applicationId: input.application_id, decision: input.decision };
}

export async function cancelSupabaseLeaveApplication(applicationId: number) {
  const client = requireClient();
  const { data, error } = await client.rpc("foreign_teacher_cancel_leave_application", { p_application_id: applicationId });
  if (error) throw error;
  return data as { application_id: number; status: "Deleted"; notification_id: null };
}

export async function dispatchSupabaseLeaveNotification(notificationId: number) {
  const client = requireClient();
  const { data, error } = await client.functions.invoke("send-line-notification", {
    body: { notification_id: notificationId },
  });
  if (error) throw error;
  return data as { ok: boolean; status: string };
}

export async function uploadSupabaseLeaveAttachment(applicationId: number, file: File): Promise<SupabaseLeaveAttachment> {
  const client = requireClient();
  if (file.size > 10 * 1024 * 1024) throw new Error("Attachment must be 10 MB or smaller");
  const storageKey = `${applicationId}/${crypto.randomUUID()}-${file.name}`;
  const uploaded = await client.storage.from("foreign-teacher-leave-attachments").upload(storageKey, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw uploaded.error;
  const metadata = await client.from("foreign_teacher_leave_attachments").insert({ application_id: applicationId, file_name: file.name, mime_type: file.type || "application/octet-stream", storage_key: storageKey }).select("id, application_id, file_name, mime_type, uploaded_at").single();
  if (metadata.error) throw metadata.error;
  return metadata.data as SupabaseLeaveAttachment;
}

export async function createSupabaseLeaveApplication(input: Omit<SupabaseLeaveApplication, "id" | "created_at" | "updated_at" | "status" | "foreign_teacher_leave_days" | "foreign_teacher_leave_attachments"> & { foreign_teacher_leave_days: Array<Omit<SupabaseLeaveDay, "id" | "application_id">> }) {
  const client = requireClient();
  const { foreign_teacher_leave_days, ...application } = input;
  const inserted = await client.from("foreign_teacher_leave_applications").insert({ ...application, status: "Pending" }).select("id").single();
  if (inserted.error) throw inserted.error;
  const days = foreign_teacher_leave_days.map((day) => ({ ...day, application_id: inserted.data.id }));
  const dayResult = await client.from("foreign_teacher_leave_days").insert(days);
  if (dayResult.error) throw dayResult.error;
  const assignedSchool = foreign_teacher_leave_days[0]?.assigned_school;
  if (!assignedSchool || foreign_teacher_leave_days.some((day) => day.assigned_school !== assignedSchool)) throw new Error("A leave application must route to one school");
  const notification = await client.from("foreign_teacher_leave_notifications").insert({ application_id: inserted.data.id, recipient_type: "SchoolMailbox", recipient_ref: assignedSchool, event_type: "Submitted", channel: "LINE", status: "Queued" });
  if (notification.error) throw notification.error;
  return inserted.data.id as number;
}
