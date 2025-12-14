export function NumberReveal({ number, category, onHide }) {
  return (
    <div className="screen number-reveal" onClick={onHide}>
      <div className="category-reminder">{category}</div>

      <div className="number-display">
        <span className="number">{number}</span>
      </div>

      <p className="hint">Tap anywhere to hide</p>
    </div>
  )
}
