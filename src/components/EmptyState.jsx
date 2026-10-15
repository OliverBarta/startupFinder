export default function EmptyState({ onClearAll }) {
  return (
    <div className="empty">
      <div className="empty__title">No startups match those filters</div>
      <p className="empty__text">Try a broader search, or clear a filter or two.</p>
      <button type="button" className="btn btn--primary" onClick={onClearAll}>
        Clear all filters
      </button>
    </div>
  )
}
