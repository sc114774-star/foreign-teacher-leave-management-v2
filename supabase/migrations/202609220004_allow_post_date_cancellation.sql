begin;

create or replace function public.foreign_teacher_cancel_leave_application(p_application_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
set row_security = off
as $$
declare
  application_row public.foreign_teacher_leave_applications%rowtype;
  assigned_school_name text;
  refund_hours numeric(8,2);
  notification_id bigint;
begin
  if not public.foreign_teacher_is_teacher() then
    raise exception 'Current account is not recognized as a foreign teacher';
  end if;

  select * into application_row
  from public.foreign_teacher_leave_applications
  where id = p_application_id
    and teacher_id = auth.uid()
  for update;

  if not found then
    raise exception 'Leave application not found or not owned by current user';
  end if;
  if application_row.status not in ('Pending', 'Approved') then
    raise exception 'Only pending or approved leave applications can be cancelled';
  end if;

  -- Post-date cancellation is intentionally allowed. There is deliberately
  -- no end_at/current_date expiry check here.
  select min(assigned_school)
    into assigned_school_name
  from public.foreign_teacher_leave_days
  where application_id = p_application_id;
  if assigned_school_name is null then
    raise exception 'Leave application has no routed school';
  end if;

  refund_hours := application_row.total_hours;

  update public.foreign_teacher_leave_applications
    set status = 'Cancelled', updated_at = now()
    where id = p_application_id;

  update public.foreign_teacher_leave_balances
    set approved_used_hours = greatest(0, approved_used_hours - refund_hours),
        updated_at = now()
    where teacher_id = application_row.teacher_id
      and leave_type = application_row.leave_type
      and academic_year = format(
        '%s-%s',
        extract(year from (application_row.start_at - interval '7 months'))::int,
        extract(year from (application_row.start_at - interval '7 months'))::int + 1
      );

  insert into public.foreign_teacher_leave_notifications
    (application_id, recipient_type, recipient_ref, event_type, channel, status)
  values
    (p_application_id, 'SchoolMailbox', assigned_school_name, 'Cancelled', 'LINE', 'Queued')
  returning id into notification_id;

  return jsonb_build_object(
    'application_id', p_application_id,
    'status', 'Cancelled',
    'notification_id', notification_id
  );
end;
$$;

grant execute on function public.foreign_teacher_cancel_leave_application(bigint) to authenticated;

commit;
