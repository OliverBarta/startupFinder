import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogoMark } from './icons'
import './Header.css'

export default function Header() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()

  // Reload once signed out so every page starts fresh without the old session's data.
  async function handleLogOut() {
    await signOut()
    window.location.reload()
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand">
          <span className="header__logo">
            <LogoMark />
          </span>
          <span className="header__name">Startup Finder</span>
        </Link>
        {/* NavLink sets aria-current="page" on the active route, which Header.css styles. */}
        <nav aria-label="Main" className="header__nav">
          <NavLink to="/" end>Browse</NavLink>
          <NavLink to="/for-founders">For founders</NavLink>
          <NavLink to="/saved">Saved</NavLink>
        </nav>
        <div className="header__actions">
          {user ? (
            <button type="button" className="header__login" onClick={handleLogOut}>Log out</button>
          ) : (
            // Remember where the user was so the login page can send them back.
            <Link to="/login" state={{ from: pathname }} className="header__login">Log in</Link>
          )}
          <Link to="/for-founders#list" className="header__cta">List your startup</Link>
        </div>
      </div>
    </header>
  )
}
