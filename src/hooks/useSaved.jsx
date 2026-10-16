import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { fromListingRow } from '../lib/listings'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// The signed-in user's saved startups (rows of `saved_listings`), shared by Browse
// (bookmark toggles) and the Saved page. Signed-out visitors have no saves.
// Also holds how many users saved each listing, for the "Most saved" sort and the count on cards.
const SavedContext = createContext(null)

// Postgres unique_violation: the listing is already saved, which is what we wanted.
const ALREADY_SAVED = '23505'

export function SavedProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // Tagged with the user it was loaded for, so switching account never shows someone else's saves.
  const [loaded, setLoaded] = useState({ userId: null, listings: [] })
  // Listing IDs with a save/unsave request in flight; repeat clicks on them are ignored.
  const pending = useRef(new Set())
  // Save totals per listing ID from listing_save_counts() (supabase/listing_save_counts.sql),
  // fetched once. null until loaded, or if the function is missing.
  const [saveCounts, setSaveCounts] = useState(null)
  // This session's own saves (+1) and unsaves (−1) since the totals loaded, so the count on a
  // card follows the bookmark without refetching.
  const [countChanges, setCountChanges] = useState({})

  useEffect(() => {
    let cancelled = false
    supabase.rpc('listing_save_counts').then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('Couldn’t load save counts:', error.message)
        return
      }
      setSaveCounts(Object.fromEntries(data.map((row) => [row.listing_id, Number(row.save_count)])))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('saved_listings')
      .select('created_at, listings(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Couldn’t load saved startups:', error.message)
        const listings = (data ?? []).filter((row) => row.listings).map((row) => fromListingRow(row.listings))
        setLoaded({ userId, listings })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const savedListings = userId && loaded.userId === userId ? loaded.listings : []
  const loading = Boolean(userId) && loaded.userId !== userId
  const savedIds = new Set(savedListings.map((l) => l.id))

  function setListings(update) {
    setLoaded((current) => ({ ...current, listings: update(current.listings) }))
  }

  function changeCount(id, by) {
    setCountChanges((changes) => ({ ...changes, [id]: (changes[id] ?? 0) + by }))
  }

  // Live total for a card, or null when the totals aren't available.
  function saveCountOf(id) {
    if (!saveCounts) return null
    return Math.max(0, (saveCounts[id] ?? 0) + (countChanges[id] ?? 0))
  }

  // Takes the whole listing (not just its ID) so the Saved page can show it straight away.
  // The bookmark flips immediately and flips back if the request fails.
  async function toggleSaved(listing) {
    if (!userId || loading || pending.current.has(listing.id)) return
    pending.current.add(listing.id)
    const wasSaved = savedIds.has(listing.id)

    setListings((list) => (wasSaved ? list.filter((l) => l.id !== listing.id) : [listing, ...list]))
    changeCount(listing.id, wasSaved ? -1 : 1)
    const { error } = wasSaved
      ? await supabase.from('saved_listings').delete().eq('listing_id', listing.id)
      : await supabase.from('saved_listings').insert({ listing_id: listing.id })

    if (error?.code === ALREADY_SAVED) {
      // The save already existed (so it's already in the totals): keep the bookmark, undo the +1.
      changeCount(listing.id, -1)
    } else if (error) {
      console.error(`Couldn’t ${wasSaved ? 'unsave' : 'save'} ${listing.name}:`, error.message)
      setListings((list) => (wasSaved ? [listing, ...list] : list.filter((l) => l.id !== listing.id)))
      changeCount(listing.id, wasSaved ? 1 : -1)
    }
    pending.current.delete(listing.id)
  }

  return (
    <SavedContext value={{ savedListings, savedIds, loading, toggleSaved, saveCounts, saveCountOf }}>
      {children}
    </SavedContext>
  )
}

// Provider and hook share a file on purpose; edits here do a full reload instead of fast refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function useSaved() {
  return useContext(SavedContext)
}
