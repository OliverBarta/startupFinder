import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from './components/EmptyState'
import FilterSidebar from './components/FilterSidebar'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ResultsToolbar from './components/ResultsToolbar'
import StartupCard from './components/StartupCard'
import StartupDialog from './components/StartupDialog'
import { SECTORS, SORTS } from './data/startups'
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

// `startups` arrive newest first, so "recent" keeps that order, and ties in the other sorts stay newest first.
// `saveCounts` maps listing ID → how many users saved it (listings nobody saved are missing, i.e. 0).
// It's the totals as first loaded, so cards don't jump around while you bookmark them.
function sortStartups(startups, sort, saveCounts) {
  if (sort === 'name') return [...startups].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  if (sort === 'saved' && saveCounts) {
    return [...startups].sort((a, b) => (saveCounts[b.id] ?? 0) - (saveCounts[a.id] ?? 0))
  }
  return startups
}

// `q` and `place` are already trimmed and lower-cased.
function matches(startup, q, place, filters) {
  if (q) {
    const haystack = [startup.name, startup.sector, startup.location, startup.blurb].filter(Boolean).join(' ')
    if (!haystack.toLowerCase().includes(q)) return false
  }
  // The hero's location box matches any part of the location ("waterloo" finds "Waterloo, ON").
  if (place && !startup.location?.toLowerCase().includes(place)) return false
  if (filters.locations.length && !(startup.location && filters.locations.includes(locationKey(startup.location)))) {
    return false
  }
  if (filters.sectors.length && !filters.sectors.includes(startup.sector)) return false
  if (filters.stages.length && !filters.stages.includes(startup.stage)) return false
  if (filters.sizes.length && !filters.sizes.includes(startup.size)) return false
  if (filters.hiring && !startup.hiring) return false
  return true
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState(SORTS[0].value)
  // The startup open in the "View" popup, or null.
  const [viewing, setViewing] = useState(null)
  // All listings from Supabase, newest first. null while loading.
  const [startups, setStartups] = useState(null)
  const [loadError, setLoadError] = useState('')
  const { user } = useAuth()
  const { savedIds, toggleSaved, saveCounts, saveCountOf } = useSaved()
  const resultsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setLoadError(error.message)
        setStartups((data ?? []).map(fromListingRow))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const all = startups ?? []
  const sectorCounts = Object.fromEntries(
    SECTORS.map((sector) => [sector, all.filter((s) => s.sector === sector).length]),
  )
  const locations = locationOptions(all)
  const locationLabels = Object.fromEntries(locations.map((o) => [o.value, o.label]))
  const trimmedQuery = query.trim()
  const trimmedPlace = place.trim()
  const results = sortStartups(
    all.filter((s) => matches(s, trimmedQuery.toLowerCase(), trimmedPlace.toLowerCase(), filters)),
    sort,
    saveCounts,
  )

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
            count={results.length}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            activeTags={activeTags}
          />

          {startups === null ? (
            <EmptyState title="Loading startups…" />
          ) : loadError ? (
            <EmptyState title="Couldn’t load startups" text={loadError} />
          ) : all.length === 0 ? (
            <EmptyState title="No startups listed yet" text="Be the first to put your startup on the map.">
              <Link to="/for-founders#list" className="btn btn--primary empty__cta">List your startup</Link>
            </EmptyState>
          ) : results.length > 0 ? (
            <>
              <div className={`results__list results__list--${view}`}>
                {results.map((startup) => (
                  <StartupCard
                    key={startup.id}
                    startup={startup}
                    saved={savedIds.has(startup.id)}
                    // Only signed-in users can save, so the bookmark and save count are hidden otherwise.
                    onToggleSave={user ? () => toggleSaved(startup) : undefined}
                    saveCount={user ? saveCountOf(startup.id) : null}
                    onView={() => setViewing(startup)}
                  />
                ))}
              </div>
              <div className="results__more">
                <button type="button" className="btn btn--outline">Load more startups</button>
              </div>
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
        saveCount={user && viewing ? saveCountOf(viewing.id) : null}
        onClose={() => setViewing(null)}
      />

      <Footer />
    </div>
  )
}
