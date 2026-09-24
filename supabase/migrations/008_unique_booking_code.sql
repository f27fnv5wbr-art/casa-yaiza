-- Required for idempotent email imports, including simultaneous deliveries.
-- Resolve any pre-existing duplicate codes before applying this migration.
create unique index if not exists reservations_owner_booking_code_unique
  on public.reservations (owner_id, upper(booking_code));
