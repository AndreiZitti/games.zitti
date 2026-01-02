export function Tile({ tile, selected, onClick, disabled = false, size = 50 }) {
  const shapeClass = `shape-${tile.shape}`
  // Scale font size proportionally (default 50px tile = 1.75rem font)
  const fontSize = `${(size / 50) * 1.75}rem`

  return (
    <div
      className={`quirtle-tile ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      data-color={tile.color}
      onClick={disabled ? undefined : onClick}
      style={{ width: size, height: size, fontSize }}
    >
      <span className={shapeClass}></span>
    </div>
  )
}
