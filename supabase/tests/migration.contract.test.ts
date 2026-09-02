import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../migrations/202608280001_initial_leave_management.sql", import.meta.url), "utf8");

describe("Supabase migration contract", () => {
  it("defines the leave domain and Auth role profile", () => {
    expect(migration).toContain("create table public.profiles");
    expect(migration).toContain("create table public.leave_applications");
    expect(migration).toContain("create table public.leave_days");
    expect(migration).toContain("create type public.app_role");
    expect(migration).toContain("create or replace function public.current_role()");
  });

  it("enables RLS and protects teacher/school access", () => {
    expect(migration).toContain("alter table public.leave_applications enable row level security");
    expect(migration).toContain("create policy applications_read_authorized");
    expect(migration).toContain("create policy approvals_review_insert");
    expect(migration).toContain("public.can_review_school(school)");
  });

  it("creates a private attachment bucket and Storage policies", () => {
    expect(migration).toContain("'leave-attachments', 'leave-attachments', false");
    expect(migration).toContain("create policy leave_storage_read on storage.objects");
    expect(migration).toContain("public.can_access_application((split_part(name, '/', 1))::bigint)");
  });

  it("defines the notification queue lifecycle", () => {
    expect(migration).toContain("create table public.leave_notifications");
    expect(migration).toContain("'Queued', 'Sent', 'Failed'");
    expect(migration).toContain("create policy notifications_insert_authorized");
  });
});
