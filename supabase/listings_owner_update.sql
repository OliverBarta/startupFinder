-- ============================================================
-- Let users edit their own listings
-- Used by the For founders page, which edits a listing after it's posted.
--
-- Without an update policy, RLS silently blocks every update (no
-- error, zero rows changed), and the page shows "you don't have
-- permission to edit it".
-- ============================================================

drop policy if exists "Owners can update their listings" on public.listings;

create policy "Owners can update their listings"
on public.listings
for update
to authenticated
using ((select auth.uid()) = user_id)
-- Also checked on the new row, so a listing can't be handed to another user.
with check ((select auth.uid()) = user_id);
