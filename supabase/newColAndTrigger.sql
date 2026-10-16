-- ============================================================
-- 1. Add the column and fill it in for existing listings
-- ============================================================

alter table public.listings
  add column save_count integer not null default 0
  check (save_count >= 0);

update public.listings l
set save_count = (
  select count(*) from public.saved_listings s where s.listing_id = l.id
);


-- ============================================================
-- 2. Trigger function that keeps the count in sync
--
-- Lives in a private schema so it's never exposed through the API.
-- SECURITY DEFINER is needed because the person saving a listing
-- usually doesn't own it, so RLS would block them from updating it.
-- search_path = '' stops anyone hijacking it with look-alike tables.
-- ============================================================

create schema if not exists private;

create or replace function private.update_listing_save_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.listings
    set save_count = save_count + 1
    where id = new.listing_id;

  elsif tg_op = 'DELETE' then
    update public.listings
    set save_count = greatest(save_count - 1, 0)
    where id = old.listing_id;
  end if;

  return null;  -- return value is ignored for AFTER triggers
end;
$$;

revoke all on function private.update_listing_save_count() from public, anon, authenticated;

create trigger saved_listings_update_save_count
  after insert or delete on public.saved_listings
  for each row execute function private.update_listing_save_count();


-- ============================================================
-- 3. Stop users editing save_count themselves
--
-- The existing update policy lets owners edit their own listing,
-- which would include save_count. Column-level grants fix that:
-- users can only write the columns listed here.
-- ============================================================

revoke insert, update on public.listings from authenticated;

grant insert (name, location, year, website, one_line_description,
              sector, email, stage, team_size, color, hiring)
  on public.listings to authenticated;

grant update (name, location, year, website, one_line_description,
              sector, email, stage, team_size, color, hiring)
  on public.listings to authenticated;