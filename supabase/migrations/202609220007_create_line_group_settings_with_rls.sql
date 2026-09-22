begin;

-- This table stores one LINE administrative group per school.
-- The application and Edge Function use the column name group_id.
create table if not exists public.foreign_teacher_line_group_settings (
  school text primary key
    check (school in ('青山國小', '東原國中')),
  group_id text not null
    check (length(trim(group_id)) > 0),
  updated_by uuid not null
    references auth.users(id),
  updated_at timestamptz not null default now()
);

create index if not exists foreign_teacher_line_group_settings_updated_by_idx
  on public.foreign_teacher_line_group_settings(updated_by);

grant select, insert, update, delete
  on public.foreign_teacher_line_group_settings
  to authenticated;

alter table public.foreign_teacher_line_group_settings
  enable row level security;

drop policy if exists foreign_teacher_line_group_settings_read
  on public.foreign_teacher_line_group_settings;
drop policy if exists foreign_teacher_line_group_settings_manage
  on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_manage
  on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_school_insert
  on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_school_update
  on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_school_delete
  on public.foreign_teacher_line_group_settings;

create policy foreign_teacher_line_group_settings_read
  on public.foreign_teacher_line_group_settings
  for select
  to authenticated
  using (true);

create policy line_group_settings_school_insert
  on public.foreign_teacher_line_group_settings
  for insert
  to authenticated
  with check (
    updated_by = auth.uid()
    and (
      lower(public.foreign_teacher_current_role()::text) = 'admin'
      or (
        lower(public.foreign_teacher_current_role()::text) = 'cingshan'
        and school = '青山國小'
      )
      or (
        lower(public.foreign_teacher_current_role()::text) = 'dongyuan'
        and school = '東原國中'
      )
    )
  );

create policy line_group_settings_school_update
  on public.foreign_teacher_line_group_settings
  for update
  to authenticated
  using (
    lower(public.foreign_teacher_current_role()::text) = 'admin'
    or (
      lower(public.foreign_teacher_current_role()::text) = 'cingshan'
      and school = '青山國小'
    )
    or (
      lower(public.foreign_teacher_current_role()::text) = 'dongyuan'
      and school = '東原國中'
    )
  )
  with check (
    updated_by = auth.uid()
    and (
      lower(public.foreign_teacher_current_role()::text) = 'admin'
      or (
        lower(public.foreign_teacher_current_role()::text) = 'cingshan'
        and school = '青山國小'
      )
      or (
        lower(public.foreign_teacher_current_role()::text) = 'dongyuan'
        and school = '東原國中'
      )
    )
  );

create policy line_group_settings_school_delete
  on public.foreign_teacher_line_group_settings
  for delete
  to authenticated
  using (
    lower(public.foreign_teacher_current_role()::text) = 'admin'
    or (
      lower(public.foreign_teacher_current_role()::text) = 'cingshan'
      and school = '青山國小'
    )
    or (
      lower(public.foreign_teacher_current_role()::text) = 'dongyuan'
      and school = '東原國中'
    )
  );

commit;
