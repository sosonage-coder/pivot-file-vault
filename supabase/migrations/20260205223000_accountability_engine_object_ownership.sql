-- Accountability engine primitives: object ownership + reconciliation review checklist

alter table public.objects
  add column if not exists owner_name text,
  add column if not exists reviewer_name text,
  add column if not exists approver_name text;

create table if not exists public.reconciliation_review_checks (
  reconciliation_id uuid primary key references public.reconciliations(id) on delete cascade,
  support_attached boolean not null default false,
  tie_out_complete boolean not null default false,
  variance_explained boolean not null default false,
  sign_off_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_recon_review_checks_updated_at
  on public.reconciliation_review_checks(updated_at desc);

alter table public.reconciliation_review_checks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reconciliation_review_checks'
      and policyname = 'Users can manage review checks for their entities'
  ) then
    create policy "Users can manage review checks for their entities"
      on public.reconciliation_review_checks
      for all
      using (
        exists (
          select 1
          from public.reconciliations r
          where r.id = reconciliation_id
            and (
              r.entity_id in (
                select ue.entity_id
                from public.user_entities ue
                where ue.user_id = auth.uid()
              )
              or public.has_role(auth.uid(), 'admin')
            )
        )
      )
      with check (
        exists (
          select 1
          from public.reconciliations r
          where r.id = reconciliation_id
            and (
              r.entity_id in (
                select ue.entity_id
                from public.user_entities ue
                where ue.user_id = auth.uid()
              )
              or public.has_role(auth.uid(), 'admin')
            )
        )
      );
  end if;
end$$;
