import { PinIcon, SearchIcon } from './icons'
import './Hero.css'

export default function Hero({ total, query, onQueryChange, place, onPlaceChange, placeSuggestions, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__eyebrow">{total} startups indexed</div>
        <h1 className="hero__title">Find the startup you’re looking for.</h1>

        <form role="search" className="search" onSubmit={handleSubmit}>
          <div className="search__field search__field--query">
            <SearchIcon />
            <label htmlFor="q" className="visually-hidden">Search startups</label>
            <input
              id="q"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Try “climate”, “dev tools”, or a company name"
            />
          </div>
          <div className="search__field search__field--location">
            <PinIcon />
            <label htmlFor="loc" className="visually-hidden">Location</label>
            <input
              id="loc"
              type="text"
              list="loc-suggestions"
              autoComplete="off"
              value={place}
              onChange={(e) => onPlaceChange(e.target.value)}
              placeholder="Anywhere"
            />
            {/* The browser shows these as suggestions while typing; any text still works. */}
            <datalist id="loc-suggestions">
              {placeSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
          <button type="submit" className="search__submit">Search</button>
        </form>
      </div>
    </section>
  )
}
