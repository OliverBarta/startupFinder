import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Field from './components/Field'
import Footer from './components/Footer'
import StartupCard from './components/StartupCard'
import Switch from './components/Switch'
import { CheckIcon } from './components/icons'
import { LOGO_COLORS, SECTORS, SIZES, STAGES } from './data/startups'
import { useAuth } from './hooks/useAuth'
import { initialsOf, toListingRow } from './lib/listings'
import { supabase } from './lib/supabase'
import './ForFounders.css'

const BLURB_MAX = 140
// Same pattern as the email check on the listings table, so bad addresses are caught before sending.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const EMPTY_LISTING = {
  name: '',
  location: '',
  founded: '',
  website: '',
  blurb: '',
  sector: SECTORS[0],
  email: '',
  stage: 'Seed',
  size: SIZES[0],
  logoColor: LOGO_COLORS[0],
  hiring: true,
}

export default function ForFounders() {
  const { user, loading } = useAuth()
  const [listing, setListing] = useState(EMPTY_LISTING)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const listRef = useRef(null)
  const { pathname, hash, key } = useLocation()

  // Links to /for-founders#list (header CTA, footer) should land on the form.
  // `key` changes on every navigation, so this also fires when already on the page.
  useEffect(() => {
    if (hash === '#list') listRef.current?.scrollIntoView({ block: 'start' })
  }, [hash, key])

  function set(field, value) {
    setListing((l) => ({ ...l, [field]: value }))
  }

  const nameInvalid = !listing.name.trim()
  const emailInvalid = !EMAIL_PATTERN.test(listing.email.trim())
  const yearInvalid = listing.founded !== '' && (Number(listing.founded) < 1900 || Number(listing.founded) > 2100)

  let validationError = ''
  if (nameInvalid || !listing.email.trim()) validationError = 'Add a startup name and a contact email to submit.'
  else if (emailInvalid) validationError = 'Enter a valid contact email, like you@company.com.'
  else if (yearInvalid) validationError = 'Enter a founding year between 1900 and 2100.'

  const showValidation = triedSubmit && Boolean(validationError)
  const error = showValidation ? validationError : submitError

  async function handleSubmit(event) {
    event.preventDefault()
    if (validationError) {
      setTriedSubmit(true)
      return
    }

    setSubmitError('')
    setSubmitting(true)
    const { error } = await supabase.from('listings').insert(toListingRow(listing))
    setSubmitting(false)

    if (error) {
      setSubmitError(`Your listing couldn’t be saved: ${error.message}`)
      return
    }
    setSubmitted(true)
    setTriedSubmit(false)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function reset() {
    setListing(EMPTY_LISTING)
    setSubmitted(false)
  }

  const previewName = listing.name.trim() || 'Your startup'
  const preview = {
    ...listing,
    name: previewName,
    initials: initialsOf(listing.name),
    location: listing.location.trim() || 'City, Province',
    founded: listing.founded || 'YYYY',
    blurb: listing.blurb.trim() || 'One line on what you build and who it’s for.',
  }

  return (
    <div className="founders-page">
      <div className="container founders">
        <section id="list" ref={listRef} aria-labelledby="list-heading" className="listing">
          <div className="listing__head">
            <div className="listing__eyebrow">List your startup</div>
            <h1 id="list-heading" className="listing__title">Tell us about your company</h1>
          </div>

          {loading ? null : !user ? (
            <div className="listing__panel">
              <h2 className="listing__panel-title">Log in to post a startup</h2>
              <p className="listing__panel-text">You need an account to list your startup on Startup Finder.</p>
              {/* Send them back here (to the form) once they've logged in. */}
              <Link
                to="/login"
                state={{ from: `${pathname}#list` }}
                className="btn btn--primary listing__panel-action listing__panel-action--link"
              >
                Log in
              </Link>
            </div>
          ) : submitted ? (
            <div role="status" className="listing__panel">
              <span className="listing__panel-icon">
                <CheckIcon />
              </span>
              <div className="listing__panel-title">{previewName} has been posted</div>
              <button type="button" className="btn btn--outline listing__panel-action" onClick={reset}>
                Post another startup
              </button>
            </div>
          ) : (
            <div className="listing__body">
              <form className="listing__form" onSubmit={handleSubmit} noValidate>
                <div className="listing__row">
                  <Field id="f-name" label="Startup name">
                    <input
                      id="f-name"
                      type="text"
                      className="field__input"
                      value={listing.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Northwind Labs"
                      aria-invalid={showValidation && nameInvalid}
                      aria-describedby={error ? 'listing-error' : undefined}
                    />
                  </Field>
                  <Field id="f-loc" label="Location">
                    <input
                      id="f-loc"
                      type="text"
                      className="field__input"
                      value={listing.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="City, Province or Remote"
                    />
                  </Field>
                  <Field id="f-year" label="Year founded">
                    <input
                      id="f-year"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      className="field__input"
                      value={listing.founded}
                      onChange={(e) => set('founded', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="2025"
                      aria-invalid={showValidation && yearInvalid}
                      aria-describedby={error ? 'listing-error' : undefined}
                    />
                  </Field>
                  <Field id="f-web" label="Website">
                    <input
                      id="f-web"
                      type="url"
                      className="field__input"
                      value={listing.website}
                      onChange={(e) => set('website', e.target.value)}
                      placeholder="https://"
                    />
                  </Field>
                </div>

                <Field
                  id="f-blurb"
                  label="One-line description"
                  aside={<span className="field__count">{listing.blurb.length}/{BLURB_MAX}</span>}
                >
                  <textarea
                    id="f-blurb"
                    rows={3}
                    maxLength={BLURB_MAX}
                    className="field__input field__input--textarea"
                    value={listing.blurb}
                    onChange={(e) => set('blurb', e.target.value)}
                    placeholder="What you build and who it’s for."
                  />
                </Field>

                <div className="listing__row">
                  <Field id="f-sector" label="Sector">
                    <select
                      id="f-sector"
                      className="field__input field__input--select"
                      value={listing.sector}
                      onChange={(e) => set('sector', e.target.value)}
                    >
                      {SECTORS.map((sector) => (
                        <option key={sector}>{sector}</option>
                      ))}
                    </select>
                  </Field>
                  <Field id="f-email" label="Contact email">
                    <input
                      id="f-email"
                      type="email"
                      className="field__input"
                      value={listing.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="you@company.com"
                      aria-invalid={showValidation && emailInvalid}
                      aria-describedby={error ? 'listing-error' : undefined}
                    />
                  </Field>
                </div>

                <ChoiceGroup legend="Stage" options={STAGES} value={listing.stage} onChange={(v) => set('stage', v)} />
                <ChoiceGroup legend="Team size" options={SIZES} value={listing.size} onChange={(v) => set('size', v)} />

                {/* the logo color group */}
                <fieldset className="listing__group">
                  <legend className="field__label listing__legend">Logo colour</legend>
                  <div className="listing__swatches">
                    {LOGO_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className="swatch"
                        style={{ background: hex }}
                        aria-label={`Colour ${hex}`}
                        aria-pressed={listing.logoColor === hex}
                        onClick={() => set('logoColor', hex)}
                      />
                    ))}
                  </div>
                </fieldset>

                <Switch label="We’re currently hiring" checked={listing.hiring} onChange={(v) => set('hiring', v)} />

                {error && (
                  <p id="listing-error" role="alert" className="listing__error">
                    {error}
                  </p>
                )}

                <div className="listing__submit-row">
                  <button type="submit" className="btn btn--primary listing__submit" disabled={submitting}>
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                  <span className="listing__note">You can edit your listing any time after posting.</span>
                </div>
              </form>

              <aside aria-label="Card preview" className="listing__preview">
                <div className="listing__eyebrow">Live preview</div>
                <StartupCard startup={preview} preview />
                <p className="listing__preview-note">This is how your startup will appear in Browse and Saved.</p>
              </aside>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}

function ChoiceGroup({ legend, options, value, onChange }) {
  return (
    <fieldset className="listing__group">
      <legend className="field__label listing__legend">{legend}</legend>
      <div className="listing__pills">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="pill"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
