-- Populate only with codigo/descripcion returned by SES catalogo(TIPO_PAGO).
create table if not exists public.ses_payment_types (
  code text primary key check (length(code) between 1 and 50),
  description text not null check (length(trim(description)) > 0),
  updated_at timestamptz not null default now()
);

alter table public.ses_payment_types enable row level security;
drop policy if exists "authenticated read payment catalog" on public.ses_payment_types;
create policy "authenticated read payment catalog" on public.ses_payment_types
  for select to authenticated using (true);

grant select on public.ses_payment_types to authenticated;
revoke insert, update, delete on public.ses_payment_types from anon, authenticated;
