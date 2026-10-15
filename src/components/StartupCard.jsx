import { BookmarkIcon } from './icons'
import './StartupCard.css'

export default function StartupCard({ startup, saved, onToggleSave }) {
  const { name, initials, location, founded, blurb, sector, stage, size, hiring, logoColor } = startup

  return (
    <article className="card">
      <div className="card__head">
        <div className="card__logo" style={{ background: logoColor }} aria-hidden="true">
          {initials}
        </div>
        <div className="card__title">
          <h3 className="card__name">
            <a href="#">{name}</a>
          </h3>
          <div className="card__meta">
            {location} · Founded {founded}
          </div>
        </div>
        <button
          type="button"
          className="card__save"
          aria-label={`Save ${name}`}
          aria-pressed={saved}
          onClick={onToggleSave}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <p className="card__blurb">{blurb}</p>

      <div className="card__badges">
        <span className="card__badge">{sector}</span>
        <span className="card__badge">{stage}</span>
        <span className="card__badge">{size} people</span>
      </div>

      <div className="card__foot">
        {hiring ? (
          <span className="card__hiring">
            <span className="card__hiring-dot" />
            Hiring
          </span>
        ) : (
          <span className="card__not-hiring">Not hiring</span>
        )}
        <a href="#" className="card__link">View profile →</a>
      </div>
    </article>
  )
}
