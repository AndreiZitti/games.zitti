import { Tile } from './Tile'

export function PlayerHand({ hand, selectedTiles, onSelectTile, disabled }) {
  const isSelected = (index) => selectedTiles.includes(index)

  return (
    <div className="quirtle-hand">
      {hand.map((tile, index) => (
        <Tile
          key={index}
          tile={tile}
          selected={isSelected(index)}
          onClick={() => onSelectTile(index)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
