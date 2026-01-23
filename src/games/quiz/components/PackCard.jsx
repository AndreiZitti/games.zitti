import './PackCard.css'

const PACK_ICONS = {
  'opentdb-db': '🧠',
  'opentdb': '🌐',
  'test-pack': '🧪',
  'default': '📦'
}

export function PackCard({
  id,
  name,
  description,
  questionCount,
  categoryCount,
  selected,
  loading,
  onClick
}) {
  const icon = PACK_ICONS[id] || PACK_ICONS.default

  return (
    <button
      className={`pack-card ${selected ? 'pack-card--selected' : ''} ${loading ? 'pack-card--loading' : ''}`}
      onClick={onClick}
      disabled={loading}
    >
      {selected && <span className="pack-card__check">✓</span>}
      <span className="pack-card__icon">{icon}</span>
      <span className="pack-card__name">{name}</span>
      <span className="pack-card__description">{description}</span>
      <div className="pack-card__stats">
        <span className="pack-card__stat">📝 {questionCount} questions</span>
        <span className="pack-card__stat">📁 {categoryCount} categories</span>
      </div>
      {loading && (
        <div className="pack-card__loading">
          <span className="pack-card__spinner" />
          Loading questions...
        </div>
      )}
    </button>
  )
}
