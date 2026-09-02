import { describe, expect, it } from "vitest";
import { createSupabaseLeaveApplication, decideSupabaseLeaveApplication, fetchSupabaseBalances, fetchSupabaseLeaveApplications, fetchSupabasePtoSettings, fetchSupabaseTeacherProfiles, getSupabaseAttachmentUrl, upsertSupabasePtoSetting } from "./supabaseLeave";

describe("Supabase leave data-access contract", () => {
  it("fails clearly when the Supabase client is not configured", async () => {
    await expect(fetchSupabaseLeaveApplications()).rejects.toThrow("Supabase is not configured");
    await expect(fetchSupabaseBalances("114")).rejects.toThrow("Supabase is not configured");
    await expect(fetchSupabasePtoSettings("2025-2026")).rejects.toThrow("Supabase is not configured");
    await expect(fetchSupabaseTeacherProfiles()).rejects.toThrow("Supabase is not configured");
    await expect(upsertSupabasePtoSetting({ teacherId: "00000000-0000-0000-0000-000000000001", academicYear: "2025-2026", totalDays: 14 })).rejects.toThrow("Supabase is not configured");
    await expect(getSupabaseAttachmentUrl(1, 1)).rejects.toThrow("Supabase is not configured");
    await expect(decideSupabaseLeaveApplication({ application_id: 1, school: "青山國小", decision: "Approved" })).rejects.toThrow("Supabase is not configured");
    await expect(createSupabaseLeaveApplication({
      application_no: "LV-CONTRACT-001", teacher_id: "00000000-0000-0000-0000-000000000001", leave_type: "PTO", reason: "test", official_document_no: null, official_location: null,
      start_at: "2025-06-17T00:00:00Z", end_at: "2025-06-17T08:00:00Z", total_hours: 8,
      foreign_teacher_leave_days: [{ leave_date: "2025-06-17", hours: 8, assigned_school: "青山國小", route_reason: "Tuesday → Cingshan" }],
    })).rejects.toThrow("Supabase is not configured");
  });
});
