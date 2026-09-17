create extension if not exists pgcrypto;
create type public.registration_status as enum ('not_started','in_progress','complete','reported');
create table public.reservations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 booking_code text not null, holder_name text not null, check_in date not null, check_out date not null,
 guest_count int not null check(guest_count between 1 and 30), language text not null default 'es' check(language in ('es','en','de')),
 status public.registration_status not null default 'not_started', guest_token_hash text unique not null,
 guest_token_expires_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint valid_dates check(check_out > check_in)
);
create table public.guests (
 id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade,
 role text not null check(role in ('holder','adult','minor')), first_name text, surname1 text, surname2 text,
 sex text, birth_date date, nationality text, document_type text, document_number text, document_support text,
 address text, locality text, country text, phone text, email text, relationship_to_adult text, responsible_adult_id uuid references public.guests(id),
 signature_path text, completed boolean not null default false, created_at timestamptz not null default now()
);
alter table public.reservations enable row level security; alter table public.guests enable row level security;
create policy "owners read reservations" on public.reservations for select using(auth.uid()=owner_id);
create policy "owners insert reservations" on public.reservations for insert with check(auth.uid()=owner_id);
create policy "owners update reservations" on public.reservations for update using(auth.uid()=owner_id);
create policy "owners read guests" on public.guests for select using(exists(select 1 from public.reservations r where r.id=reservation_id and r.owner_id=auth.uid()));
create policy "owners manage guests" on public.guests for all using(exists(select 1 from public.reservations r where r.id=reservation_id and r.owner_id=auth.uid()));
