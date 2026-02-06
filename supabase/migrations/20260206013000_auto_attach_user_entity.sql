-- Auto-attach new users to a default entity (single-tenant fallback)

create or replace function public.attach_user_to_default_entity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_id uuid;
  v_entity_count int;
begin
  select id into v_entity_id
  from public.entities
  where name = 'Acme Corp'
  limit 1;

  if v_entity_id is null then
    select count(*) into v_entity_count from public.entities;
    if v_entity_count = 1 then
      select id into v_entity_id from public.entities limit 1;
    end if;
  end if;

  if v_entity_id is not null then
    insert into public.user_entities (user_id, entity_id)
    values (new.id, v_entity_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists attach_user_to_default_entity on auth.users;
create trigger attach_user_to_default_entity
after insert on auth.users
for each row
execute function public.attach_user_to_default_entity();
