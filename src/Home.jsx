import { useRef, useState } from 'react'
import EmptyState from './components/EmptyState'
import FilterSidebar from './components/FilterSidebar'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ResultsToolbar from './components/ResultsToolbar'
import StartupCard from './components/StartupCard'
import { SECTORS, STARTUPS } from './data/startups'
import { useSaved } from './hooks/useSaved'
import './Home.css'

const NO_FILTERS = { sectors: [], stages: [], sizes: [], hiring: false }

const SECTOR_COUNTS = Object.fromEntries(
  SECTORS.map((sector) => [sector, STARTUPS.filter((s) => s.sector === sector).length]),
)

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

function matches(startup, q, filters) {
  if (q) {
    const haystack = `${startup.name} ${startup.sector} ${startup.location} ${startup.blurb}`
    if (!haystack.toLowerCase().includes(q)) return false
  }
  if (filters.sectors.length && !filters.sectors.includes(startup.sector)) return false
  if (filters.stages.length && !filters.stages.includes(startup.stage)) return false
  if (filters.sizes.length && !filters.sizes.includes(startup.size)) return false
  if (filters.hiring && !startup.hiring) return false
  return true
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [view, setView] = useState('grid')
  const { savedIds, toggleSaved } = useSaved()
  const resultsRef = useRef(null)

  const trimmedQuery = query.trim()
  const results = STARTUPS.filter((s) => matches(s, trimmedQuery.toLowerCase(), filters))

  function toggleFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: toggleIn(f[key], value) }))
  }

  function setHiring(hiring) {
    setFilters((f) => ({ ...f, hiring }))
  }

  function clearAll() {
    setQuery('')
    setFilters(NO_FILTERS)
  }

  function showResults() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeTags = [
    ...filters.sectors.map((v) => ({ id: `sector-${v}`, label: v, onRemove: () => toggleFilter('sectors', v) })),
    ...filters.stages.map((v) => ({ id: `stage-${v}`, label: v, onRemove: () => toggleFilter('stages', v) })),
    ...filters.sizes.map((v) => ({ id: `size-${v}`, label: `${v} people`, onRemove: () => toggleFilter('sizes', v) })),
    ...(filters.hiring ? [{ id: 'hiring', label: 'Hiring', onRemove: () => setHiring(false) }] : []),
    ...(trimmedQuery ? [{ id: 'query', label: `“${trimmedQuery}”`, onRemove: () => setQuery('') }] : []),
  ]

  return (
    <div className="home">
      <Hero total={STARTUPS.length} query={query} onQueryChange={setQuery} onSubmit={showResults} />

      <div className="container layout">
        <FilterSidebar
          filters={filters}
          sectorCounts={SECTOR_COUNTS}
          onToggle={toggleFilter}
          onToggleHiring={() => setHiring(!filters.hiring)}
          onClearAll={clearAll}
        />

        <section aria-label="Results" className="results" ref={resultsRef}>
          <ResultsToolbar count={results.length} view={view} onViewChange={setView} activeTags={activeTags} />

          {results.length > 0 ? (
            <>
              <div className={`results__list results__list--${view}`}>
                {results.map((startup) => (
                  <StartupCard
                    key={startup.id}
                    startup={startup}
                    saved={savedIds.includes(startup.id)}
                    onToggleSave={() => toggleSaved(startup.id)}
                  />
                ))}
              </div>
              <div className="results__more">
                <button type="button" className="btn btn--outline">Load more startups</button>
              </div>
            </>
          ) : (
            <EmptyState onClearAll={clearAll} />
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
