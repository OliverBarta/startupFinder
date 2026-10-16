import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Field from './components/Field'
import Footer from './components/Footer'
import StartupCard from './components/StartupCard'
import Switch from './components/Switch'
import { CheckIcon, ChevronIcon } from './components/icons'
import { LOGO_COLORS, SECTORS, SIZES, STAGES } from './data/startups'
import { useAuth } from './hooks/useAuth'
import { useSaved } from './hooks/useSaved'
import { initialsOf, toListingForm, toListingRow } from './lib/listings'
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

// Whether two versions of the form would save the same row (so trailing spaces don't count as a change).
function sameListing(a, b) {
  return JSON.stringify(toListingRow(a)) === JSON.stringify(toListingRow(b))
}

export default function ForFounders() {
  const { user, loading } = useAuth()
  const { forgetListing } = useSaved()
  const userId = user?.id
  // The signed-in user's own listings (table rows), newest first. null while loading.
  const [myListings, setMyListings] = useState(null)
  const [loadError, setLoadError] = useState('')
  // The listing open for editing, and whether "Create new listing" has swapped in the create form.
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  // What's in the form right now.
  const [listing, setListing] = useState(EMPTY_LISTING)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  // "Posted" / "Saved" message next to the button; the next edit clears it.
  const [notice, setNotice] = useState('')
  const listRef = useRef(null)
  const { pathname, hash, key } = useLocation()

  // Links to /for-founders#list (footer, Browse empty state) should land on the form.
  // `key` changes on every navigation, so this also fires when already on the page.
  useEffect(() => {
    if (hash === '#list') listRef.current?.scrollIntoView({ block: 'start' })
  }, [hash, key])

  // Load the user's listings and open the newest for editing (or the create form if they have none).
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setLoadError(error.message)
          return
        }
        setMyListings(data)
        if (data.length) {
          setSelectedId(data[0].id)
          setListing(toListingForm(data[0]))
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const selected = myListings?.find((row) => row.id === selectedId)
  // Editing `selected`, or posting a new listing (no listings yet, or "Create new listing").
  const editing = Boolean(selected) && !creating
  const dirty = !sameListing(listing, editing ? toListingForm(selected) : EMPTY_LISTING)

  function set(field, value) {
    setListing((l) => ({ ...l, [field]: value }))
    setNotice('')
  }

  // Switches what the form shows. Unsaved edits would be lost, so ask first.
  function openForm(nextListing, { id = selectedId, create = false } = {}) {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return
    setSelectedId(id)
    setCreating(create)
    setListing(nextListing)
    setTriedSubmit(false)
    setSubmitError('')
    setNotice('')
  }

  function selectListing(id) {
    openForm(toListingForm(myListings.find((row) => row.id === id)), { id })
  }

  function discardChanges() {
    setListing(toListingForm(selected))
    setTriedSubmit(false)
    setSubmitError('')
  }

  const nameInvalid = !listing.name.trim()
  const emailInvalid = !EMAIL_PATTERN.test(listing.email.trim())
  const yearInvalid = listing.founded !== '' && (Number(listing.founded) < 1900 || Number(listing.founded) > 2100)

  let validationError = ''
  if (nameInvalid || !listing.email.trim()) validationError = `Add a startup name and a contact email to ${editing ? 'save' : 'submit'}.`
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
    const row = toListingRow(listing)
    const { data, error } = editing
      ? await supabase.from('listings').update(row).eq('id', selected.id).select()
      : await supabase.from('listings').insert(row).select()
    setSubmitting(false)

    // RLS doesn't raise an error for an update it blocks: it just updates (and returns) no rows.
    const saved = data?.[0]
    if (error || !saved) {
      setSubmitError(`Your listing couldn’t be saved: ${error ? error.message : 'you don’t have permission to edit it.'}`)
      return
    }

    // Stay on the saved listing, now open for editing.
    setMyListings((rows) => (editing ? rows.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...rows]))
    setSelectedId(saved.id)
    setCreating(false)
    setListing(toListingForm(saved))
    setTriedSubmit(false)
    setNotice(editing ? 'Changes saved.' : `${saved.name} has been posted. You can edit it here any time.`)
  }

  async function handleDelete() {
    const { id, name } = selected
    if (!window.confirm(`Delete ${name}? This can’t be undone.`)) return

    setSubmitError('')
    setDeleting(true)
    const { data, error } = await supabase.from('listings').delete().eq('id', id).select()
    setDeleting(false)

    // As with updates, RLS doesn't raise an error for a delete it blocks: it just deletes (and returns) no rows.
    if (error || !data?.length) {
      setSubmitError(`${name} couldn’t be deleted: ${error ? error.message : 'you don’t have permission to delete it.'}`)
      return
    }

    // Its saves are deleted with it (supabase/listings_owner_delete.sql), including the user's own.
    forgetListing(id)
    // Open the next listing, or the create form if that was the last one.
    const rest = myListings.filter((row) => row.id !== id)
    setMyListings(rest)
    setSelectedId(rest[0]?.id ?? null)
    setListing(rest[0] ? toListingForm(rest[0]) : EMPTY_LISTING)
    setTriedSubmit(false)
    setNotice(`${name} has been deleted.`)
  }

  const busy = submitting || deleting
  const previewName = listing.name.trim() || 'Your startup'
  const preview = {
    ...listing,
    name: previewName,
    initials: initialsOf(listing.name),
    location: listing.location.trim() || 'City, Province',
    founded: listing.founded || 'YYYY',
    blurb: listing.blurb.trim() || 'One line on what you build and who it’s for.',
  }

  let note = 'You can edit your listing any time after posting.'
  if (editing) note = dirty ? 'You have unsaved changes.' : 'Saved changes show in Browse straight away.'

  const createHead = (
    <div className="listing__head-text">
      <div className="listing__eyebrow">{selected ? 'New listing' : 'List your startup'}</div>
      <h1 id="list-heading" className="listing__title">Tell us about your company</h1>
    </div>
  )

  let content
  if (loading) {
    content = null
  } else if (!user) {
    content = (
      <>
        <div className="listing__head">{createHead}</div>
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
      </>
    )
  } else if (loadError) {
    content = (
      <>
        <div className="listing__head">{createHead}</div>
        <div className="listing__panel">
          <h2 className="listing__panel-title">Couldn’t load your listings</h2>
          <p className="listing__panel-text">{loadError}</p>
        </div>
      </>
    )
  } else if (myListings === null) {
    content = null
  } else {
    content = (
      <>
        <div className="listing__head">
          {editing ? (
            <div className="listing__head-text">
              {myListings.length > 1 ? (
                <>
                  {/* The name is a dropdown for switching between the user's listings. */}
                  <label htmlFor="f-pick" className="listing__eyebrow">Your listings</label>
                  <h1 id="list-heading" className="visually-hidden">{selected.name}</h1>
                  <span className="listing__picker">
                    <select
                      id="f-pick"
                      className="listing__title listing__picker-select"
                      value={selectedId}
                      onChange={(e) => selectListing(e.target.value)}
                    >
                      {myListings.map((row) => (
                        <option key={row.id} value={row.id}>{row.name}</option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </span>
                </>
              ) : (
                <>
                  <div className="listing__eyebrow">Your listing</div>
                  <h1 id="list-heading" className="listing__title">{selected.name}</h1>
                </>
              )}
            </div>
          ) : (
            createHead
          )}
          {editing ? (
            <button
              type="button"
              className="btn btn--outline listing__head-action"
              onClick={() => openForm(EMPTY_LISTING, { create: true })}
            >
              Create new listing
            </button>
          ) : selected ? (
            <button
              type="button"
              className="btn btn--outline listing__head-action"
              onClick={() => openForm(toListingForm(selected))}
            >
              Back to your listings
            </button>
          ) : null}
        </div>

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
              <button
                type="submit"
                className="btn btn--primary listing__submit"
                disabled={busy || (editing && !dirty)}
              >
                {editing ? (submitting ? 'Saving…' : 'Save changes') : submitting ? 'Posting…' : 'Post'}
              </button>
              {editing && dirty && (
                <button type="button" className="btn btn--outline listing__submit" onClick={discardChanges} disabled={busy}>
                  Discard changes
                </button>
              )}
              <span role="status" className="listing__note">
                {notice ? (
                  <span className="listing__notice">
                    <span className="listing__notice-icon">
                      <CheckIcon />
                    </span>
                    {notice}
                  </span>
                ) : (
                  note
                )}
              </span>
              {editing && (
                <button type="button" className="btn listing__submit listing__delete" onClick={handleDelete} disabled={busy}>
                  {deleting ? 'Deleting…' : 'Delete listing'}
                </button>
              )}
            </div>
          </form>

          <aside aria-label="Card preview" className="listing__preview">
            <div className="listing__eyebrow">Live preview</div>
            <StartupCard startup={preview} preview />
            <p className="listing__preview-note">
              This is how your startup {editing ? 'appears' : 'will appear'} in Browse and Saved.
            </p>
          </aside>
        </div>
      </>
    )
  }

  return (
    <div className="founders-page">
      <div className="container founders">
        <section id="list" ref={listRef} aria-labelledby="list-heading" className="listing">
          {content}
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
