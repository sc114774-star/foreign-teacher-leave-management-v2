begin;

alter table public.foreign_teacher_line_group_settings enable row level security;

drop policy if exists foreign_teacher_line_group_settings_manage on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_manage on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_school_insert on public.foreign_teacher_line_group_settings;
drop policy if exists line_group_settings_school_update on public.foreign_teacher_line_group_settings;

create policy line_group_settings_school_insert
  on public.foreign_teacher_line_group_settings
  for insert
  to authenticated
  with check (
    updated_by = auth.uid()
    and (
      lower(public.foreign_teacher_current_role()::text) = 'admin'
      or (lower(public.foreign_teacher_current_role()::text) = 'cingshan' and school = '青山國小')
      or (lower(public.foreign_teacher_current_role()::text) = 'dongyuan' and school = '東原國中')
    )
  );

create policy line_group_settings_school_update
  on public.foreign_teacher_line_group_settings
  for update
  to authenticated
  using (
    lower(public.foreign_teacher_current_role()::text) = 'admin'
    or (lower(public.foreign_teacher_current_role()::text) = 'cingshan' and school = '青山國小')
    or (lower(public.foreign_teacher_current_role()::text) = 'dongyuan' and school = '東原國中')
  )
  with check (
    updated_by = auth.uid()
    and (
      lower(public.foreign_teacher_current_role()::text) = 'admin'
      or (lower(public.foreign_teacher_current_role()::text) = 'cingshan' and school = '青山國小')
      or (lower(public.foreign_teacher_current_role()::text) = 'dongyuan' and school = '東原國中')
    )
  );

create policy line_group_settings_school_delete
  on public.foreign_teacher_line_group_settings
  for delete
  to authenticated
  using (
    lower(public.foreign_teacher_current_role()::text) = 'admin'
    or (lower(public.foreign_teacher_current_role()::text) = 'cingshan' and school = '青山國小')
    or (lower(public.foreign_teacher_current_role()::text) = 'dongyuan' and school = '東原國中')
  );

commit;
