import './Field.css'

// A labelled form field. `aside` sits opposite the label (e.g. a character count).
export default function Field({ id, label, aside, children }) {
  return (
    <div className="field">
      <div className="field__head">
        <label htmlFor={id} className="field__label">{label}</label>
        {aside}
      </div>
      {children}
    </div>
  )
}
