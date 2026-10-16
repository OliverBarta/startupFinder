import { useEffect, useRef } from 'react'
import { BookmarkIcon, CloseIcon, ExternalIcon, MailIcon, PinIcon } from './icons'
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
// `saveCount` shows when it's a number (same as on the cards).
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
  // Sector, stage and team size as tiles; empty ones are skipped.
  const facts = startup
    ? [
        ['Sector', startup.sector],
        ['Stage', startup.stage],
        ['Team size', startup.size && `${startup.size} people`],
      ].filter(([, value]) => value)
    : []
  const hasSaves = typeof saveCount === 'number'

  return (
    <dialog ref={ref} className="startup-dialog" aria-labelledby="startup-dialog-name" onClose={onClose} onClick={handleClick}>
      {startup && (
        // The banner and logo take the listing's logo colour (grey when it has none).
        <div className="startup-dialog__panel" style={startup.logoColor ? { '--logo': startup.logoColor } : undefined}>
          <div className="startup-dialog__banner">
            <button type="button" className="startup-dialog__close" aria-label="Close" onClick={close}>
              <CloseIcon size={14} />
            </button>
          </div>

          <div className="startup-dialog__body">
            <div className="startup-dialog__top">
              <div className="startup-dialog__logo" aria-hidden="true">
                {startup.initials}
              </div>
              {startup.hiring ? (
                <span className="startup-dialog__status startup-dialog__status--hiring">
                  <span className="startup-dialog__hiring-dot" />
                  Hiring
                </span>
              ) : (
                <span className="startup-dialog__status">Not hiring</span>
              )}
            </div>

            <div className="startup-dialog__title">
              <h2 id="startup-dialog-name" className="startup-dialog__name">{startup.name}</h2>
              {(startup.location || startup.founded) && (
                <div className="startup-dialog__meta">
                  {startup.location && (
                    <span className="startup-dialog__meta-item">
                      <PinIcon />
                      {startup.location}
                    </span>
                  )}
                  {startup.founded && <span className="startup-dialog__meta-item">Founded {startup.founded}</span>}
                </div>
              )}
            </div>

            {startup.blurb && <p className="startup-dialog__blurb">{startup.blurb}</p>}

            {facts.length > 0 && (
              <dl className="startup-dialog__facts">
                {facts.map(([label, value]) => (
                  <div key={label} className="startup-dialog__fact">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {(startup.website || startup.email) && (
              <div className="startup-dialog__actions">
                {startup.website &&
                  (href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn--primary startup-dialog__action">
                      <span className="startup-dialog__action-text">{websiteLabel(startup.website)}</span>
                      <ExternalIcon />
                    </a>
                  ) : (
                    // Not an http(s) address, so it's shown but not linked.
                    <span className="startup-dialog__action startup-dialog__action--plain">{startup.website}</span>
                  ))}
                {startup.email && (
                  <a href={`mailto:${startup.email}`} className="btn btn--outline startup-dialog__action">
                    <MailIcon />
                    <span className="startup-dialog__action-text">{startup.email}</span>
                  </a>
                )}
              </div>
            )}

            {(startup.listedAt || hasSaves) && (
              <div className="startup-dialog__foot">
                {startup.listedAt && <span>Listed {LISTED_DATE.format(new Date(startup.listedAt))}</span>}
                {hasSaves && (
                  <span className="startup-dialog__saves">
                    <BookmarkIcon size={14} />
                    {saveCount} {saveCount === 1 ? 'save' : 'saves'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
