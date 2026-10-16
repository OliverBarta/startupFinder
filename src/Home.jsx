import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from './components/EmptyState'
import FilterSidebar from './components/FilterSidebar'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ResultsToolbar from './components/ResultsToolbar'
import StartupCard from './components/StartupCard'
import StartupDialog from './components/StartupDialog'
import { SECTORS } from './data/startups'
import { useAuth } from './hooks/useAuth'
import { useSaved } from './hooks/useSaved'
import { fromListingRow } from './lib/listings'
import { supabase } from './lib/supabase'
import './Home.css'

const NO_FILTERS = { sectors: [], stages: [], sizes: [], locations: [], hiring: false }

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

// Locations are free text, so "Toronto, ON" and "toronto, on " count as the same place.
function locationKey(location) {
  return location.trim().toLowerCase()
}

// Every distinct location across the listings, for the sidebar filter and the hero's suggestions.
// Most listings first; the label is the first spelling seen.
function locationOptions(startups) {
  const byKey = new Map()
  for (const startup of startups) {
    if (!startup.location?.trim()) continue
    const key = locationKey(startup.location)
    const option = byKey.get(key) ?? { value: key, label: startup.location.trim(), count: 0 }
    option.count += 1
    byKey.set(key, option)
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

// A LIKE pattern matching `text` anywhere, with % and _ in the text matching themselves.
function containsPattern(text) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

// Quotes a value inside a PostgREST or=(…) list, where commas, dots and brackets have meaning.
function orValue(value) {
  return `"${value.replace(/[\\"]/g, (c) => `\\${c}`)}"`
}

const SEARCH_COLUMNS = ['name', 'sector', 'location', 'one_line_description']

// Results load 12 at a time: the first page, then the next one each time you scroll to the bottom.
const PAGE_SIZE = 12
// PostgREST's error for a page that starts past the last row (results shrank since the last page).
const PAST_THE_END = 'PGRST103'

// The Supabase request for one page (PAGE_SIZE rows from `from`) of the listings matching the search,
// filters and sort, plus the total number of matches. `query` and `place` are trimmed;
// `locationSpellings` is every stored spelling of the ticked locations.
function listingsQuery({ sort, query, place, filters, locationSpellings }, from) {
  let request = supabase.from('listings').select('*', { count: 'exact' })
  if (query) {
    const pattern = orValue(containsPattern(query))
    request = request.or(SEARCH_COLUMNS.map((column) => `${column}.ilike.${pattern}`).join(','))
  }
  // The hero's location box matches any part of the location ("waterloo" finds "Waterloo, ON").
  if (place) request = request.ilike('location', containsPattern(place))
  if (filters.locations.length) request = request.in('location', locationSpellings)
  if (filters.sectors.length) request = request.in('sector', filters.sectors)
  if (filters.stages.length) request = request.in('stage', filters.stages)
  if (filters.sizes.length) request = request.in('team_size', filters.sizes)
  if (filters.hiring) request = request.eq('hiring', true)

  if (sort === 'name') request = request.order('name')
  if (sort === 'saved') request = request.order('save_count', { ascending: false })
  // "Recently added", and the tiebreak for the other sorts. `id` makes the order fully fixed, so pages don't overlap.
  return request
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, from + PAGE_SIZE - 1)
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('saved')
  // The startup open in the "View" popup, or null.
  const [viewing, setViewing] = useState(null)
  // Every listing's sector and location (null while loading). The sidebar counts, the location
  // list and the hero's total cover all listings, not just the current results.
  const [catalog, setCatalog] = useState(null)
  // The search boxes as last sent to Supabase: they update as you type, and the request waits for a pause.
  const [search, setSearch] = useState({ query: '', place: '' })
  // The pages of listings loaded so far for the current search, filters and sort, in order, with the
  // total number of matches. Tagged with the request they answer (so the list can be marked as out of
  // date while the next one loads). null until the first answer.
  const [loaded, setLoaded] = useState(null)
  // Loading the next page: 'idle', 'loading' or 'error' (then it waits for "Try again").
  const [moreState, setMoreState] = useState('idle')
  const loadingMore = useRef(false)
  // The "Loading more" row under the cards; scrolling it into view loads the next page.
  const sentinelRef = useRef(null)
  const { user } = useAuth()
  const { savedIds, toggleSaved, saveCountOf, noteSaveCounts } = useSaved()
  const resultsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('listings')
      .select('id, sector, location')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Couldn’t load the filter options:', error.message)
        setCatalog(data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const next = { query: query.trim(), place: place.trim() }
    const timer = setTimeout(() => {
      setSearch((current) => (current.query === next.query && current.place === next.place ? current : next))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, place])

  // Locations are ticked case-insensitively, so match every way each one is spelled in the listings.
  const locationSpellings = [
    ...new Set(
      (catalog ?? [])
        .map((listing) => listing.location)
        .filter((location) => location && filters.locations.includes(locationKey(location))),
    ),
  ]
  // Every change of search, filter or sort asks Supabase again, and only then (the key is the request's
  // parameters). The current cards stay up until the answer arrives.
  const requestKey = JSON.stringify({ sort, ...search, filters, locationSpellings })
  useEffect(() => {
    let cancelled = false
    listingsQuery(JSON.parse(requestKey), 0).then(({ data, error, count }) => {
      if (cancelled) return
      const startups = (data ?? []).map(fromListingRow)
      setLoaded({ key: requestKey, startups, total: count ?? startups.length, error: error?.message ?? '' })
      setMoreState('idle')
      noteSaveCounts(startups)
    })
    return () => {
      cancelled = true
    }
  }, [requestKey, noteSaveCounts])

  const results = loaded?.startups ?? []
  const loadError = loaded?.error ?? ''
  const stale = loaded !== null && loaded.key !== requestKey
  const hasMore = loaded !== null && !loadError && results.length < loaded.total

  // Requests only the next PAGE_SIZE rows (from the number already shown) and adds them to the list.
  async function loadMore() {
    if (!hasMore || stale || loadingMore.current) return
    const { key, startups: shown } = loaded
    loadingMore.current = true
    setMoreState('loading')
    const { data, error, count } = await listingsQuery(JSON.parse(key), shown.length)
    loadingMore.current = false
    if (error && error.code !== PAST_THE_END) {
      console.error('Couldn’t load more startups:', error.message)
      setMoreState('error')
      return
    }
    setMoreState('idle')
    const page = (data ?? []).map(fromListingRow)
    noteSaveCounts(page)
    setLoaded((current) => {
      // Drop the page if the search, filters or sort changed while it loaded.
      if (current.key !== key || current.startups.length !== shown.length) return current
      // Rows shift if listings are added, removed or re-ranked between pages; skip any already shown.
      const ids = new Set(current.startups.map((s) => s.id))
      const added = page.filter((s) => !ids.has(s.id))
      const startups = [...current.startups, ...added]
      // Nothing new means the end of the results, whatever the total said.
      return { ...current, startups, total: added.length ? (count ?? current.total) : startups.length }
    })
  }

  // The observer calls the latest loadMore, which sees the current state.
  const loadMoreRef = useRef(loadMore)
  useEffect(() => {
    loadMoreRef.current = loadMore
  })

  // Watch the "Loading more" row. Observing again after each page (or a new first page) fires right
  // away if the row is still in view, so a tall screen keeps filling until it isn't. Stops after an error.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || moreState === 'error') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current()
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, results.length, stale, moreState])
  const all = catalog ?? []
  const sectorCounts = Object.fromEntries(
    SECTORS.map((sector) => [sector, all.filter((s) => s.sector === sector).length]),
  )
  const locations = locationOptions(all)
  const locationLabels = Object.fromEntries(locations.map((o) => [o.value, o.label]))
  const trimmedQuery = query.trim()
  const trimmedPlace = place.trim()

  function toggleFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: toggleIn(f[key], value) }))
  }

  function setHiring(hiring) {
    setFilters((f) => ({ ...f, hiring }))
  }

  function clearAll() {
    setQuery('')
    setPlace('')
    setFilters(NO_FILTERS)
  }

  function showResults() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeTags = [
    ...filters.sectors.map((v) => ({ id: `sector-${v}`, label: v, onRemove: () => toggleFilter('sectors', v) })),
    ...filters.stages.map((v) => ({ id: `stage-${v}`, label: v, onRemove: () => toggleFilter('stages', v) })),
    ...filters.sizes.map((v) => ({ id: `size-${v}`, label: `${v} people`, onRemove: () => toggleFilter('sizes', v) })),
    ...filters.locations.map((v) => ({
      id: `location-${v}`,
      label: locationLabels[v] ?? v,
      onRemove: () => toggleFilter('locations', v),
    })),
    ...(filters.hiring ? [{ id: 'hiring', label: 'Hiring', onRemove: () => setHiring(false) }] : []),
    ...(trimmedQuery ? [{ id: 'query', label: `“${trimmedQuery}”`, onRemove: () => setQuery('') }] : []),
    ...(trimmedPlace ? [{ id: 'place', label: `In “${trimmedPlace}”`, onRemove: () => setPlace('') }] : []),
  ]

  return (
    <div className="home">
      <Hero
        total={all.length}
        query={query}
        onQueryChange={setQuery}
        place={place}
        onPlaceChange={setPlace}
        placeSuggestions={locations.map((o) => o.label)}
        onSubmit={showResults}
      />

      <div className="container layout">
        <FilterSidebar
          filters={filters}
          sectorCounts={sectorCounts}
          locations={locations}
          onToggle={toggleFilter}
          onToggleHiring={setHiring}
          onClearAll={clearAll}
        />

        <section aria-label="Results" className="results" ref={resultsRef}>
          <ResultsToolbar
            count={loaded?.total ?? 0}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            activeTags={activeTags}
          />

          {loaded === null ? (
            <EmptyState title="Loading startups…" />
          ) : loadError ? (
            <EmptyState title="Couldn’t load startups" text={loadError} />
          ) : catalog?.length === 0 || (results.length === 0 && activeTags.length === 0) ? (
            <EmptyState title="No startups listed yet" text="Be the first to put your startup on the map.">
              <Link to="/for-founders#list" className="btn btn--primary empty__cta">List your startup</Link>
            </EmptyState>
          ) : results.length > 0 ? (
            <>
              <div className={`results__list results__list--${view}`} aria-busy={stale}>
                {results.map((startup) => (
                  <StartupCard
                    key={startup.id}
                    startup={startup}
                    saved={savedIds.has(startup.id)}
                    // Only signed-in users can save; signed-out visitors get a disabled bookmark.
                    onToggleSave={user ? () => toggleSaved(startup) : undefined}
                    saveCount={saveCountOf(startup.id)}
                    onView={() => setViewing(startup)}
                  />
                ))}
              </div>
              {hasMore && (
                <div ref={sentinelRef} className="results__more" role="status">
                  {moreState === 'error' ? (
                    <>
                      <span>Couldn’t load more startups.</span>
                      <button type="button" className="btn btn--outline results__retry" onClick={loadMore}>
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="results__spinner" aria-hidden="true" />
                      Loading more startups…
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No startups match those filters" text="Try a broader search, or clear a filter or two.">
              <button type="button" className="btn btn--primary" onClick={clearAll}>
                Clear all filters
              </button>
            </EmptyState>
          )}
        </section>
      </div>

      <StartupDialog
        startup={viewing}
        saveCount={viewing ? saveCountOf(viewing.id) : null}
        onClose={() => setViewing(null)}
      />

      <Footer />
    </div>
  )
}
