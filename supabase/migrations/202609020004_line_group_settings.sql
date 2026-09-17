begin;

create table if not exists public.foreign_teacher_line_group_settings (
  school text primary key check (school in ('青山國小', '東原國中')),
  group_id text not null check (length(trim(group_id)) > 0),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.foreign_teacher_line_group_settings enable row level security;

drop policy if exists foreign_teacher_line_group_settings_read on public.foreign_teacher_line_group_settings;
create policy foreign_teacher_line_group_settings_read
  on public.foreign_teacher_line_group_settings for select to authenticated
  using (true);

drop policy if exists foreign_teacher_line_group_settings_manage on public.foreign_teacher_line_group_settings;
create policy foreign_teacher_line_group_settings_manage
  on public.foreign_teacher_line_group_settings for all to authenticated
  using (
    public.foreign_teacher_current_role() = 'admin'
    or (public.foreign_teacher_current_role() = 'cingshan' and school = '青山國小')
    or (public.foreign_teacher_current_role() = 'dongyuan' and school = '東原國中')
  )
  with check (
    public.foreign_teacher_current_role() = 'admin'
    or (public.foreign_teacher_current_role() = 'cingshan' and school = '青山國小')
    or (public.foreign_teacher_current_role() = 'dongyuan' and school = '東原國中')
  );

commit;
