begin;

-- Login account discovery happens before authentication. Only expose the
-- fields needed by the login dropdown; passwords and auth secrets remain in
-- Supabase Auth and are never stored in this table.
grant select on public.foreign_teacher_profiles to anon, authenticated;
drop policy if exists profiles_public_login_read on public.foreign_teacher_profiles;
create policy profiles_public_login_read
  on public.foreign_teacher_profiles
  for select
  to anon, authenticated
  using (true);

-- Teachers may update only their own application and only to the cancellation
-- state. The cancellation RPC remains the authoritative path for expiry,
-- refund, and notification checks.
drop policy if exists applications_teacher_update on public.foreign_teacher_leave_applications;
create policy applications_teacher_update
  on public.foreign_teacher_leave_applications
  for update
  to authenticated
  using (
    teacher_id = auth.uid()
    and public.foreign_teacher_current_role() = 'teacher'
  )
  with check (
    teacher_id = auth.uid()
    and public.foreign_teacher_current_role() = 'teacher'
    and status = 'Cancelled'
  );

-- Remove duplicate/test approvals while retaining the newest row for each
-- application and school pair. ctid is used only for this one-time cleanup.
delete from public.foreign_teacher_leave_approvals approvals
where approvals.ctid in (
  select duplicate_ctid
  from (
    select ctid as duplicate_ctid,
      row_number() over (
        partition by application_id, school
        order by decided_at desc, ctid desc
      ) as row_number
    from public.foreign_teacher_leave_approvals
  ) ranked
  where row_number > 1
);

alter table public.foreign_teacher_leave_approvals
  drop constraint if exists foreign_teacher_leave_approvals_application_school_key;
alter table public.foreign_teacher_leave_approvals
  add constraint foreign_teacher_leave_approvals_application_school_key
  unique (application_id, school);

commit;
