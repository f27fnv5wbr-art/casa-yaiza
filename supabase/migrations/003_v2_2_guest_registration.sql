-- Casa Yaiza V2.2 guest-registration migration.
-- Run ONCE after 001_schema.sql and 002_v2_1_security.sql.

alter table public.guests add column if not exists signature_data text;

create or replace function public.submit_guest_registration(token_hash text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations%rowtype;
  g jsonb;
  total_count integer;
  adult_count integer;
  minor_count integer;
  inserted_count integer := 0;
begin
  select * into r
  from public.reservations
  where guest_token_hash = token_hash
    and guest_token_expires_at > now()
  limit 1;

  if r.id is null then
    raise exception 'invalid_or_expired_token';
  end if;

  total_count := coalesce((payload->>'totalGuests')::integer, 0);
  adult_count := coalesce((payload->>'adultCount')::integer, 0);
  minor_count := coalesce((payload->>'minorCount')::integer, 0);

  if total_count <> r.guest_count or adult_count + minor_count <> r.guest_count or adult_count < 1 or minor_count < 0 then
    raise exception 'guest_count_mismatch';
  end if;

  if jsonb_array_length(coalesce(payload->'guests','[]'::jsonb)) <> r.guest_count then
    raise exception 'guest_array_mismatch';
  end if;

  -- A valid token replaces any unfinished registration for this reservation.
  delete from public.guests where reservation_id = r.id;

  for g in select * from jsonb_array_elements(payload->'guests')
  loop
    if coalesce(g->>'firstName','') = '' or coalesce(g->>'surname1','') = '' or coalesce(g->>'birthDate','') = '' then
      raise exception 'required_guest_fields_missing';
    end if;

    if (g->>'role') in ('holder','adult') then
      if coalesce(g->>'documentType','') = '' or coalesce(g->>'documentNumber','') = '' or coalesce(g->>'nationality','') = '' then
        raise exception 'adult_fields_missing';
      end if;
      if coalesce(g->>'signatureData','') = '' then
        raise exception 'adult_signature_missing';
      end if;
    elsif (g->>'role') = 'minor' then
      if coalesce(g->>'relationshipToAdult','') = '' then
        raise exception 'minor_relationship_missing';
      end if;
    else
      raise exception 'invalid_guest_role';
    end if;

    insert into public.guests (
      reservation_id, role, first_name, surname1, surname2, sex, birth_date,
      nationality, document_type, document_number, document_support,
      address, locality, country, phone, email, relationship_to_adult,
      signature_data, completed
    ) values (
      r.id,
      g->>'role', g->>'firstName', g->>'surname1', nullif(g->>'surname2',''),
      nullif(g->>'sex',''), (g->>'birthDate')::date, nullif(g->>'nationality',''),
      nullif(g->>'documentType',''), nullif(g->>'documentNumber',''), nullif(g->>'documentSupport',''),
      nullif(g->>'address',''), nullif(g->>'locality',''), nullif(g->>'country',''),
      nullif(g->>'phone',''), nullif(g->>'email',''), nullif(g->>'relationshipToAdult',''),
      nullif(g->>'signatureData',''), true
    );
    inserted_count := inserted_count + 1;
  end loop;

  if inserted_count <> r.guest_count then
    raise exception 'insert_count_mismatch';
  end if;

  update public.reservations
  set status = 'complete', updated_at = now()
  where id = r.id;

  return jsonb_build_object('ok', true, 'bookingCode', r.booking_code, 'guestCount', inserted_count);
end;
$$;

revoke all on function public.submit_guest_registration(text,jsonb) from public;
grant execute on function public.submit_guest_registration(text,jsonb) to anon, authenticated;
