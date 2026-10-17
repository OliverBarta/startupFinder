import { useState } from 'react'
import { SECTORS, SIZES, STAGES } from '../data/startups'
import { CheckIcon, ChevronIcon } from './icons'
import Switch from './Switch'
import './FilterSidebar.css'

// There's no Location group: locations are filtered from the hero's location box. Home still supports a
// `filters.locations` checklist (and counts it in the badge), so one could come back here.
export default function FilterSidebar({ filters, sectorCounts, onToggle, onToggleHiring, onClearAll }) {
  // Only used below the desktop breakpoint, where the filters collapse.
  const [open, setOpen] = useState(false)
  const activeCount =
    filters.sectors.length +
    filters.stages.length +
    filters.sizes.length +
    filters.locations.length +
    (filters.hiring ? 1 : 0)

  const sectorOptions = SECTORS.map((sector) => ({ value: sector, label: sector, count: sectorCounts[sector] ?? 0 }))

  return (
    <aside aria-label="Filters" className="filters">
      <div className="filters__head">
        <h2 className="filters__title">Filters</h2>
        <div className="filters__head-actions">
          <button type="button" className="filters__clear" onClick={onClearAll}>
            Clear all
          </button>
          <button
            type="button"
            className="filters__toggle"
            aria-expanded={open}
            aria-controls="filter-panel"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide' : 'Show'}
            {activeCount > 0 && <span className="filters__badge">{activeCount}</span>}
            <ChevronIcon />
          </button>
        </div>
      </div>

      <div id="filter-panel" className={`filters__body${open ? ' is-open' : ''}`}>
        <CheckGroup
          legend="Sector"
          options={sectorOptions}
          selected={filters.sectors}
          onToggle={(v) => onToggle('sectors', v)}
        />

        <PillGroup legend="Stage" options={STAGES} selected={filters.stages} onToggle={(v) => onToggle('stages', v)} />
        <PillGroup legend="Team size" options={SIZES} selected={filters.sizes} onToggle={(v) => onToggle('sizes', v)} />

        <Switch label="Only show startups hiring" checked={filters.hiring} onChange={onToggleHiring} />
      </div>
    </aside>
  )
}

// Checkbox rows with a count on the right. With `limit`, the rest hide behind "Show all"
// (selected options always stay visible so they can be unticked).
function CheckGroup({ legend, options, selected, onToggle, limit }) {
  const [showAll, setShowAll] = useState(false)
  const collapsible = limit && options.length > limit
  const visible =
    collapsible && !showAll ? options.filter((o, i) => i < limit || selected.includes(o.value)) : options

  return (
    <fieldset className="filters__group">
      <legend className="filters__legend">{legend}</legend>
      <div className="filters__checks">
        {visible.map((option) => {
          const on = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              className="check"
              aria-pressed={on}
              onClick={() => onToggle(option.value)}
            >
              <span className="check__box">{on && <CheckIcon />}</span>
              <span className="check__label">{option.label}</span>
              <span className="check__count">{option.count}</span>
            </button>
          )
        })}
      </div>
      {collapsible && (
        <button type="button" className="filters__more" onClick={() => setShowAll((s) => !s)}>
          {showAll ? 'Show fewer' : `Show all ${options.length}`}
        </button>
      )}
    </fieldset>
  )
}

function PillGroup({ legend, options, selected, onToggle }) {
  return (
    <fieldset className="filters__group">
      <legend className="filters__legend">{legend}</legend>
      <div className="filters__pills">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="pill"
            aria-pressed={selected.includes(option)}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
