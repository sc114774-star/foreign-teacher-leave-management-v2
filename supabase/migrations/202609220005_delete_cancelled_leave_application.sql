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
  refund_hours numeric(8,2);
begin
  if not public.foreign_teacher_is_teacher() then
    raise exception 'Current account is not recognized as a foreign teacher';
  end if;

  select *
  into application_row
  from public.foreign_teacher_leave_applications
  where id = p_application_id
    and teacher_id = auth.uid()
  for update;

  if not found then
    raise exception 'Leave application not found or not owned by current user';
  end if;

  if application_row.status not in ('Pending', 'Approved') then
    raise exception 'Only pending or approved leave applications can be deleted';
  end if;

  refund_hours := application_row.total_hours;

  -- Refund first. If any later delete fails, the transaction rolls back and
  -- the balance remains unchanged rather than being partially refunded.
  update public.foreign_teacher_leave_balances
  set
    approved_used_hours = greatest(0, approved_used_hours - refund_hours),
    updated_at = now()
  where teacher_id = application_row.teacher_id
    and leave_type = application_row.leave_type
    and academic_year = format(
      '%s-%s',
      extract(year from (application_row.start_at - interval '7 months'))::int,
      extract(year from (application_row.start_at - interval '7 months'))::int + 1
    );

  -- Remove private attachment objects as well as their metadata rows.
  delete from storage.objects
  where bucket_id = 'foreign-teacher-leave-attachments'
    and name like p_application_id::text || '/%';

  -- Explicit child deletion keeps this correct even if a deployment has not
  -- yet applied ON DELETE CASCADE to every foreign key.
  delete from public.foreign_teacher_leave_notifications where application_id = p_application_id;
  delete from public.foreign_teacher_leave_approvals where application_id = p_application_id;
  delete from public.foreign_teacher_leave_routing_events where application_id = p_application_id;
  delete from public.foreign_teacher_leave_attachments where application_id = p_application_id;
  delete from public.foreign_teacher_leave_days where application_id = p_application_id;

  delete from public.foreign_teacher_leave_applications
  where id = p_application_id
    and teacher_id = auth.uid();

  if not found then
    raise exception 'Leave application could not be deleted';
  end if;

  return jsonb_build_object(
    'application_id', p_application_id,
    'status', 'Deleted',
    'notification_id', null
  );
end;
$$;

grant execute on function public.foreign_teacher_cancel_leave_application(bigint) to authenticated;

commit;
