-- ============================================================
-- listing_save_counts(): how many users have saved each listing
-- Used by Browse's "Most saved" sort.
--
-- saved_listings RLS only lets users see their own saves, so this
-- runs as the function owner (security definer) to count all of them.
-- It returns only listing IDs and totals: never who saved what.
-- ============================================================

create or replace function public.listing_save_counts()
returns table (listing_id uuid, save_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select s.listing_id, count(*) as save_count
  from public.saved_listings s
  group by s.listing_id;
$$;

-- Only expose it to the site's two roles (functions are executable by everyone by default).
revoke all on function public.listing_save_counts() from public;
grant execute on function public.listing_save_counts() to anon, authenticated;
