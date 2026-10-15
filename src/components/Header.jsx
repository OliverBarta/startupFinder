import { Link, NavLink } from 'react-router-dom'
import { LogoMark } from './icons'
import './Header.css'

export default function Header() {
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
          <a href="#">For founders</a>
          <NavLink to="/saved">Saved</NavLink>
        </nav>
        <div className="header__actions">
          <a href="#" className="header__login">Log in</a>
          <a href="#" className="header__cta">List your startup</a>
        </div>
      </div>
    </header>
  )
}
