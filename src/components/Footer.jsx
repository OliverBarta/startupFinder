import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© 2026 Startup Finder</span>
        <nav aria-label="Footer" className="footer__nav">
          <a href="#">About</a>
          <a href="#">Submit a startup</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
