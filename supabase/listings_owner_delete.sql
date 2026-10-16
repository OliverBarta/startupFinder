-- ============================================================
-- Let users delete their own listings
-- Used by the For founders page's "Delete listing" button.
--
-- 1. An RLS policy so owners can delete their rows. Without it, RLS
--    silently blocks the delete (no error, zero rows removed), and the
--    page shows "you don't have permission to delete it".
-- 2. Deleting a listing also deletes everyone's saves of it. Otherwise
--    the saved_listings foreign key blocks deleting any listing that
--    someone has saved. (Cascades aren't subject to RLS, so other
--    users' saves are removed too.)
-- ============================================================

drop policy if exists "Owners can delete their listings" on public.listings;

create policy "Owners can delete their listings"
on public.listings
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Replace the existing saved_listings → listings foreign key (whatever it's
-- called) with one that cascades.
do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.saved_listings'::regclass
      and confrelid = 'public.listings'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.saved_listings drop constraint %I', fk.conname);
  end loop;
end $$;

alter table public.saved_listings
  add constraint saved_listings_listing_id_fkey
  foreign key (listing_id) references public.listings (id) on delete cascade;
