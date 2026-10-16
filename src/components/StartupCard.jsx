import { BookmarkIcon } from './icons'
import './StartupCard.css'

// `preview` renders a non-interactive copy (used by the listing form's live preview).
// Without `onToggleSave` (signed-out visitors) the bookmark button is shown disabled.
// `saveCount` (how many users saved it) shows under the bookmark when it's a number.
// `onView` opens the full details (StartupDialog), from the name or the "View" button.
// Optional fields (location, year, description…) can be null for real listings, so they're skipped when empty.
export default function StartupCard({ startup, saved, onToggleSave, saveCount, onView, preview = false }) {
  const { name, initials, location, founded, blurb, sector, stage, size, hiring, logoColor } = startup
  const meta = [location, founded && `Founded ${founded}`].filter(Boolean).join(' · ')
  const badges = [sector, stage, size && `${size} people`].filter(Boolean)

  return (
    <article className="card">
      <div className="card__head">
        <div className="card__logo" style={logoColor ? { background: logoColor } : undefined} aria-hidden="true">
          {initials}
        </div>
        <div className="card__title">
          <h3 className="card__name">
            {onView ? (
              <button type="button" className="card__name-btn" onClick={onView}>{name}</button>
            ) : (
              name
            )}
          </h3>
          {meta && <div className="card__meta">{meta}</div>}
        </div>
        {preview ? (
          <span className="card__save" aria-hidden="true">
            <BookmarkIcon />
          </span>
        ) : (
          <div className="card__save-wrap">
            {onToggleSave ? (
              <button
                type="button"
                className="card__save"
                aria-label={`Save ${name}`}
                aria-pressed={saved}
                onClick={onToggleSave}
              >
                <BookmarkIcon filled={saved} />
              </button>
            ) : (
              <button
                type="button"
                className="card__save"
                aria-label={`Log in to save ${name}`}
                title="Log in to save startups"
                disabled
              >
                <BookmarkIcon />
              </button>
            )}
            {typeof saveCount === 'number' && (
              <span className="card__save-count">
                {saveCount}
                <span className="visually-hidden"> {saveCount === 1 ? 'save' : 'saves'}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {blurb && <p className="card__blurb">{blurb}</p>}

      {badges.length > 0 && (
        <div className="card__badges">
          {badges.map((badge) => (
            <span key={badge} className="card__badge">{badge}</span>
          ))}
        </div>
      )}

      <div className="card__foot">
        {hiring ? (
          <span className="card__hiring">
            <span className="card__hiring-dot" />
            Hiring
          </span>
        ) : (
          <span className="card__not-hiring">Not hiring</span>
        )}
        {onView ? (
          <button type="button" className="card__link" aria-label={`View ${name}`} onClick={onView}>View</button>
        ) : (
          <span className="card__link">View</span>
        )}
      </div>
    </article>
  )
}
