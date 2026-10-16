import { useEffect, useRef } from 'react'
import { CloseIcon } from './icons'
import './StartupDialog.css'

// Founders type the website freely ("acme.com", "https://acme.com/"), so add https:// when it's missing
// and only ever link to http(s) addresses.
function websiteHref(website) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(website) ? website : `https://${website}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function websiteLabel(website) {
  return website.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

const LISTED_DATE = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

// The "View" popup: everything about one startup. Uses a native modal <dialog>, which traps focus,
// closes on Esc and returns focus to the button that opened it. Open while `startup` is set;
// `onClose` runs however it's closed (X, Esc or a click on the backdrop).
// `saveCount` shows when it's a number (signed-in users only, like on the cards).
export default function StartupDialog({ startup, saveCount, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (startup && !dialog.open) dialog.showModal()
    if (!startup && dialog.open) dialog.close()
  }, [startup])

  function close() {
    ref.current.close()
  }

  // The panel fills the <dialog>, so a click that lands on the <dialog> itself is on the backdrop.
  function handleClick(event) {
    if (event.target === ref.current) close()
  }

  const href = startup?.website ? websiteHref(startup.website) : null
  const details = startup
    ? [
        ['Sector', startup.sector],
        ['Stage', startup.stage],
        ['Team size', startup.size && `${startup.size} people`],
        ['Location', startup.location],
        ['Founded', startup.founded],
        [
          'Website',
          startup.website &&
            (href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">{websiteLabel(startup.website)}</a>
            ) : (
              startup.website
            )),
        ],
        ['Contact', startup.email && <a href={`mailto:${startup.email}`}>{startup.email}</a>],
        ['Saves', typeof saveCount === 'number' && saveCount],
        ['Listed', startup.listedAt && LISTED_DATE.format(new Date(startup.listedAt))],
      ].filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== false)
    : []

  return (
    <dialog ref={ref} className="startup-dialog" aria-labelledby="startup-dialog-name" onClose={onClose} onClick={handleClick}>
      {startup && (
        <div className="startup-dialog__panel">
          <button type="button" className="startup-dialog__close" aria-label="Close" onClick={close}>
            <CloseIcon size={16} />
          </button>

          <div className="startup-dialog__head">
            <div
              className="startup-dialog__logo"
              style={startup.logoColor ? { background: startup.logoColor } : undefined}
              aria-hidden="true"
            >
              {startup.initials}
            </div>
            <div className="startup-dialog__title">
              <h2 id="startup-dialog-name" className="startup-dialog__name">{startup.name}</h2>
              {startup.hiring ? (
                <span className="startup-dialog__hiring">
                  <span className="startup-dialog__hiring-dot" />
                  Hiring
                </span>
              ) : (
                <span className="startup-dialog__not-hiring">Not hiring</span>
              )}
            </div>
          </div>

          {startup.blurb && <p className="startup-dialog__blurb">{startup.blurb}</p>}

          {details.length > 0 && (
            <dl className="startup-dialog__details">
              {details.map(([label, value]) => (
                <div key={label} className="startup-dialog__row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </dialog>
  )
}
