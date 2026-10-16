import { SORTS } from '../data/startups'
import { CloseIcon, GridIcon, ListIcon } from './icons'
import './ResultsToolbar.css'

export default function ResultsToolbar({ count, sort, onSortChange, view, onViewChange, activeTags }) {
  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <p className="toolbar__count" aria-live="polite">
          <strong>{count}</strong> startups match
        </p>
        <div className="toolbar__controls">
          <label htmlFor="sort" className="toolbar__sort-label">Sort by</label>
          <select id="sort" className="toolbar__select" value={sort} onChange={(e) => onSortChange(e.target.value)}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div role="group" aria-label="Layout" className="view-toggle">
            <button
              type="button"
              className="view-toggle__btn"
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => onViewChange('grid')}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className="view-toggle__btn"
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => onViewChange('list')}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {activeTags.length > 0 && (
        <ul className="tags" aria-label="Active filters">
          {activeTags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                className="tag"
                aria-label={`Remove filter ${tag.label}`}
                onClick={tag.onRemove}
              >
                {tag.label}
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
