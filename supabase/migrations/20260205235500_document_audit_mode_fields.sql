-- Lightweight audit mode fields on documents

alter table public.documents
  add column if not exists pbc_ready boolean not null default false,
  add column if not exists audit_status text;

alter table public.documents
  drop constraint if exists documents_audit_status_check;

alter table public.documents
  add constraint documents_audit_status_check
  check (audit_status is null or audit_status in ('Requested', 'Provided', 'Complete'));

update public.documents
set audit_status = coalesce(audit_status, 'Requested')
where pbc_ready = true;
