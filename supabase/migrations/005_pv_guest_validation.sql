-- PV registration requirements and adult-to-minor relationships.
-- Run after 003_v2_2_guest_registration.sql. Do not deploy the matching UI
-- until the official TIPO_PARENTESCO codes are loaded into this table.
-- Existing reservations retain null RH contact fields until the owner edits them.
alter table public.reservations add column if not exists holder_first_name text;
alter table public.reservations add column if not exists holder_surname1 text;
alter table public.reservations add column if not exists holder_phone text;
alter table public.reservations add column if not exists holder_email text;

alter table public.guests add column if not exists postal_code text;
alter table public.guests add column if not exists municipality_code text;
alter table public.guests add column if not exists minor_relationships jsonb not null default '{}'::jsonb;

create table if not exists public.ses_relationship_types (
  code text primary key check (length(code) between 1 and 5),
  description text not null check (length(trim(description)) > 0)
);
alter table public.ses_relationship_types enable row level security;
drop policy if exists "read relationship catalog" on public.ses_relationship_types;
create policy "read relationship catalog" on public.ses_relationship_types
  for select to anon, authenticated using (true);
grant select on public.ses_relationship_types to anon, authenticated;
revoke insert, update, delete on public.ses_relationship_types from anon, authenticated;

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
  minor_index integer;
  adult_entry jsonb;
  relation_code text;
  relation_count integer;
  holder_count integer := 0;
  adult_seen integer := 0;
  minor_seen integer := 0;
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
    if btrim(coalesce(g->>'firstName','')) = '' or btrim(coalesce(g->>'surname1','')) = '' or coalesce(g->>'birthDate','') = '' then
      raise exception 'required_guest_fields_missing';
    end if;

    if btrim(coalesce(g->>'address','')) = '' or btrim(coalesce(g->>'postalCode','')) = ''
       or coalesce(g->>'country','') = '' or (btrim(coalesce(g->>'phone','')) = '' and btrim(coalesce(g->>'email','')) = '') then
      raise exception 'pv_address_or_contact_missing';
    end if;
    if g->>'country' = 'ESP' and coalesce(g->>'municipalityCode','') !~ '^[0-9]{5}$' then
      raise exception 'spanish_municipality_code_missing';
    elsif g->>'country' <> 'ESP' and btrim(coalesce(g->>'locality','')) = '' then
      raise exception 'foreign_locality_missing';
    end if;

    if (g->>'role') in ('holder','adult') then
      if coalesce(g->>'documentType','') = '' or coalesce(g->>'documentNumber','') = '' or coalesce(g->>'nationality','') = '' then
        raise exception 'adult_fields_missing';
      end if;
      if (g->>'documentType') = 'NIF' and btrim(coalesce(g->>'surname2','')) = '' then
        raise exception 'nif_second_surname_missing';
      end if;
      if (g->>'documentType') in ('NIF','NIE') and btrim(coalesce(g->>'documentSupport','')) = '' then
        raise exception 'document_support_missing';
      end if;
      adult_seen := adult_seen + 1;
      if g->>'role' = 'holder' then holder_count := holder_count + 1; end if;
      if coalesce(g->>'signatureData','') = '' then
        raise exception 'adult_signature_missing';
      end if;
    elsif (g->>'role') = 'minor' then
      minor_seen := minor_seen + 1;
    else
      raise exception 'invalid_guest_role';
    end if;

    insert into public.guests (
      reservation_id, role, first_name, surname1, surname2, sex, birth_date,
      nationality, document_type, document_number, document_support,
      address, locality, postal_code, municipality_code, country, phone, email, minor_relationships,
      signature_data, completed
    ) values (
      r.id,
      g->>'role', g->>'firstName', g->>'surname1', nullif(g->>'surname2',''),
      nullif(g->>'sex',''), (g->>'birthDate')::date, nullif(g->>'nationality',''),
      nullif(g->>'documentType',''), nullif(g->>'documentNumber',''), nullif(g->>'documentSupport',''),
      nullif(g->>'address',''), nullif(g->>'locality',''), nullif(g->>'postalCode',''), nullif(g->>'municipalityCode',''), nullif(g->>'country',''),
      nullif(g->>'phone',''), nullif(g->>'email',''), coalesce(g->'minorRelationships','{}'::jsonb),
      nullif(g->>'signatureData',''), true
    );
    inserted_count := inserted_count + 1;
  end loop;

  if holder_count <> 1 or (payload->'guests'->0->>'role') <> 'holder'
     or adult_seen <> adult_count or minor_seen <> minor_count then
    raise exception 'guest_roles_mismatch';
  end if;

  -- The relationship is declared on an adult, referencing each minor's array index.
  for minor_index in 0..r.guest_count - 1 loop
    if payload->'guests'->minor_index->>'role' = 'minor' then
      relation_count := 0;
      for adult_entry in select * from jsonb_array_elements(payload->'guests') loop
        if adult_entry->>'role' in ('holder','adult') then
          relation_code := adult_entry->'minorRelationships'->>(minor_index::text);
          if nullif(relation_code,'') is not null then
            if not exists (select 1 from public.ses_relationship_types where code = relation_code) then
              raise exception 'invalid_relationship_code';
            end if;
            relation_count := relation_count + 1;
          end if;
        end if;
      end loop;
      if relation_count < 1 then raise exception 'minor_relationship_missing'; end if;
    end if;
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
