-- Foreign Teacher Leave Management user-role seed
-- Run in the Supabase SQL Editor after the prefixed schema migration.
-- This script does not create or change passwords.

begin;

insert into public.foreign_teacher_profiles (user_id, name, email, role)
values
  ('237487f6-e3a6-4758-b091-8ff827c4073c'::uuid, 'Lavinia Cruz', 'Lavinia@csps.tn.edu.tw', 'teacher'::public.foreign_teacher_app_role),
  ('b1dea692-2325-4ac9-8f45-51306df3ecab'::uuid, 'Cingshan School', 'CINGSHAN@csps.tn.edu.tw', 'cingshan'::public.foreign_teacher_app_role),
  ('a4c4121f-3655-4bb3-8e8d-8800c074ffc4'::uuid, 'Dongyuan School', 'DONGYUAN@csps.tn.edu.tw', 'dongyuan'::public.foreign_teacher_app_role)
on conflict (user_id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  updated_at = now();

-- The frontend maps the authenticated role from app_metadata first.
-- Updating raw_app_meta_data keeps the role available in the JWT session.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
  case id
    when '237487f6-e3a6-4758-b091-8ff827c4073c'::uuid then '{"role":"teacher"}'::jsonb
    when 'b1dea692-2325-4ac9-8f45-51306df3ecab'::uuid then '{"role":"cingshan"}'::jsonb
    when 'a4c4121f-3655-4bb3-8e8d-8800c074ffc4'::uuid then '{"role":"dongyuan"}'::jsonb
  end
where id in (
  '237487f6-e3a6-4758-b091-8ff827c4073c'::uuid,
  'b1dea692-2325-4ac9-8f45-51306df3ecab'::uuid,
  'a4c4121f-3655-4bb3-8e8d-8800c074ffc4'::uuid
);

-- Verification query: expect exactly three rows with the intended roles.
select p.user_id, p.email, p.role, u.raw_app_meta_data ->> 'role' as jwt_role
from public.foreign_teacher_profiles p
join auth.users u on u.id = p.user_id
where p.user_id in (
  '237487f6-e3a6-4758-b091-8ff827c4073c'::uuid,
  'b1dea692-2325-4ac9-8f45-51306df3ecab'::uuid,
  'a4c4121f-3655-4bb3-8e8d-8800c074ffc4'::uuid
)
order by p.email;

commit;
