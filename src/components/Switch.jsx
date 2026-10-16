import './Switch.css'

// A full-width on/off row: label on the left, toggle track on the right.
export default function Switch({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span className="switch__track">
        <span className="switch__knob" />
      </span>
    </button>
  )
}
