import { Link } from 'react-router-dom'
import Footer from './components/Footer'
import StartupCard from './components/StartupCard'
import { BookmarkIcon } from './components/icons'
import { STARTUPS } from './data/startups'
import { useSaved } from './hooks/useSaved'
import './Saved.css'

export default function Saved() {
  const { savedIds, toggleSaved } = useSaved()
  const saved = STARTUPS.filter((s) => savedIds.includes(s.id))

  return (
    <div className="saved-page">
      <div className="container saved">
        <div className="saved__head">
          <h1 className="saved__title">Saved startups</h1>
          <p className="saved__count">
            <strong>{saved.length}</strong> {saved.length === 1 ? 'startup' : 'startups'} saved
          </p>
        </div>

        {saved.length > 0 ? (
          <div className="saved__grid">
            {saved.map((startup) => (
              <StartupCard
                key={startup.id}
                startup={startup}
                saved
                onToggleSave={() => toggleSaved(startup.id)}
              />
            ))}
          </div>
        ) : (
          <div className="saved__empty">
            <span className="saved__empty-icon">
              <BookmarkIcon size={22} />
            </span>
            <div className="saved__empty-title">No saved startups yet</div>
            <p className="saved__empty-text">
              Tap the bookmark on any startup while browsing and it’ll show up here.
            </p>
            <Link to="/" className="btn btn--primary saved__empty-cta">Browse startups</Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
