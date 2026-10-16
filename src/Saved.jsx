import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './components/Footer'
import StartupCard from './components/StartupCard'
import StartupDialog from './components/StartupDialog'
import { BookmarkIcon } from './components/icons'
import { useAuth } from './hooks/useAuth'
import { useSaved } from './hooks/useSaved'
import './Saved.css'

export default function Saved() {
  const { user, loading: authLoading } = useAuth()
  const { savedListings, loading, toggleSaved, saveCountOf } = useSaved()
  const ready = !authLoading && !loading
  // The startup open in the "View" popup, or null.
  const [viewing, setViewing] = useState(null)

  return (
    <div className="saved-page">
      <div className="container saved">
        <div className="saved__head">
          <h1 className="saved__title">Saved startups</h1>
          {ready && user && (
            <p className="saved__count">
              <strong>{savedListings.length}</strong> {savedListings.length === 1 ? 'startup' : 'startups'} saved
            </p>
          )}
        </div>

        {!ready ? null : !user ? (
          <div className="saved__empty">
            <span className="saved__empty-icon">
              <BookmarkIcon size={22} />
            </span>
            <h2 className="saved__empty-title">Log in to save startups</h2>
            <p className="saved__empty-text">
              Saved startups are kept on your account, so you can come back to them any time.
            </p>
            {/* Send them back here once they've logged in. */}
            <Link to="/login" state={{ from: '/saved' }} className="btn btn--primary saved__empty-cta">Log in</Link>
          </div>
        ) : savedListings.length > 0 ? (
          <div className="saved__grid">
            {savedListings.map((startup) => (
              <StartupCard
                key={startup.id}
                startup={startup}
                saved
                onToggleSave={() => toggleSaved(startup)}
                saveCount={saveCountOf(startup.id)}
                onView={() => setViewing(startup)}
              />
            ))}
          </div>
        ) : (
          <div className="saved__empty">
            <span className="saved__empty-icon">
              <BookmarkIcon size={22} />
            </span>
            <h2 className="saved__empty-title">No saved startups yet</h2>
            <p className="saved__empty-text">
              Tap the bookmark on any startup while browsing and it’ll show up here.
            </p>
            <Link to="/" className="btn btn--primary saved__empty-cta">Browse startups</Link>
          </div>
        )}
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
