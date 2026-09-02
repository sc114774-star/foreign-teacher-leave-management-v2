begin;

-- Each school office owns only the make-up days routed to its school.
alter table public.foreign_teacher_makeup_days drop constraint if exists foreign_teacher_makeup_days_academic_year_makeup_date_key;
alter table public.foreign_teacher_makeup_days add constraint foreign_teacher_makeup_days_year_date_school_key unique (academic_year, makeup_date, assigned_school);
drop policy if exists makeup_primary_manage on public.foreign_teacher_makeup_days;
create policy makeup_school_manage
  on public.foreign_teacher_makeup_days
  for all to authenticated
  using (
    public.foreign_teacher_current_role() = 'admin'
    or (public.foreign_teacher_current_role() = 'cingshan' and assigned_school = '青山國小')
    or (public.foreign_teacher_current_role() = 'dongyuan' and assigned_school = '東原國中')
  )
  with check (
    public.foreign_teacher_current_role() = 'admin'
    or (public.foreign_teacher_current_role() = 'cingshan' and assigned_school = '青山國小')
    or (public.foreign_teacher_current_role() = 'dongyuan' and assigned_school = '東原國中')
  );

commit;
