import { useState } from 'react'
import { SECTORS, SIZES, STAGES } from '../data/startups'
import { CheckIcon, ChevronIcon } from './icons'
import './FilterSidebar.css'

export default function FilterSidebar({ filters, sectorCounts, onToggle, onToggleHiring, onClearAll }) {
  // Only used below the desktop breakpoint, where the filters collapse.
  const [open, setOpen] = useState(false)
  const activeCount =
    filters.sectors.length + filters.stages.length + filters.sizes.length + (filters.hiring ? 1 : 0)

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
        <fieldset className="filters__group">
          <legend className="filters__legend">Sector</legend>
          <div className="filters__checks">
            {SECTORS.map((sector) => {
              const on = filters.sectors.includes(sector)
              return (
                <button
                  key={sector}
                  type="button"
                  className="check"
                  aria-pressed={on}
                  onClick={() => onToggle('sectors', sector)}
                >
                  <span className="check__box">{on && <CheckIcon />}</span>
                  <span className="check__label">{sector}</span>
                  <span className="check__count">{sectorCounts[sector] ?? 0}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <PillGroup legend="Stage" options={STAGES} selected={filters.stages} onToggle={(v) => onToggle('stages', v)} />
        <PillGroup legend="Team size" options={SIZES} selected={filters.sizes} onToggle={(v) => onToggle('sizes', v)} />

        <button
          type="button"
          role="switch"
          aria-checked={filters.hiring}
          className="hiring-switch"
          onClick={onToggleHiring}
        >
          <span>Only show startups hiring</span>
          <span className="hiring-switch__track">
            <span className="hiring-switch__knob" />
          </span>
        </button>
      </div>
    </aside>
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
