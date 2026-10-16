// The dashed message box in the Browse results (no matches, loading, errors).
export default function EmptyState({ title, text, children }) {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      {text && <p className="empty__text">{text}</p>}
      {children}
    </div>
  )
}
