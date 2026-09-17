-- Casa Yaiza V2.1 security migration.
-- Run once AFTER 001_schema.sql on an existing project.

-- Guests can only retrieve the limited reservation fields required for the
-- pre-check-in screen when they possess the random bearer token.
create or replace function public.lookup_guest_reservation(token_hash text)
returns table (
  booking_code text,
  check_in date,
  check_out date,
  guest_count integer,
  language text
)
language sql
security definer
set search_path = public
as $$
  select r.booking_code, r.check_in, r.check_out, r.guest_count, r.language
  from public.reservations r
  where r.guest_token_hash = token_hash
    and r.guest_token_expires_at > now()
  limit 1;
$$;

revoke all on function public.lookup_guest_reservation(text) from public;
grant execute on function public.lookup_guest_reservation(text) to anon, authenticated;

-- Ensure owners can delete their own reservations if this is later exposed in UI.
drop policy if exists "owners delete reservations" on public.reservations;
create policy "owners delete reservations"
on public.reservations for delete
to authenticated
using (auth.uid() = owner_id);

-- Tighten existing policies to authenticated users.
drop policy if exists "owners read reservations" on public.reservations;
drop policy if exists "owners insert reservations" on public.reservations;
drop policy if exists "owners update reservations" on public.reservations;
create policy "owners read reservations" on public.reservations for select to authenticated using (auth.uid() = owner_id);
create policy "owners insert reservations" on public.reservations for insert to authenticated with check (auth.uid() = owner_id);
create policy "owners update reservations" on public.reservations for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owners read guests" on public.guests;
drop policy if exists "owners manage guests" on public.guests;
create policy "owners read guests" on public.guests for select to authenticated
using (exists(select 1 from public.reservations r where r.id = reservation_id and r.owner_id = auth.uid()));
create policy "owners manage guests" on public.guests for all to authenticated
using (exists(select 1 from public.reservations r where r.id = reservation_id and r.owner_id = auth.uid()))
with check (exists(select 1 from public.reservations r where r.id = reservation_id and r.owner_id = auth.uid()));
