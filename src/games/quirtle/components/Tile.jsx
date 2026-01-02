export function Tile({ tile, selected, onClick, disabled, size = 50 }) {
  const shapeClass = `shape-${tile.shape}`

  return (
    <div
      className={`quirtle-tile ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      data-color={tile.color}
      onClick={disabled ? undefined : onClick}
      style={{ width: size, height: size }}
    >
      <span className={shapeClass}></span>
    </div>
  )
}
