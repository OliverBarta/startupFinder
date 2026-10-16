import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© 2026 Startup Finder</span>
        <nav aria-label="Footer" className="footer__nav">
          <a href="#">About</a>
          <Link to="/for-founders#list">Submit a startup</Link>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
