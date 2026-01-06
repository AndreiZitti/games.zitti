export function GameBoard({
  board,
  revealedCards,
  keyCard,
  showKey,
  selectedCard,
  onSelectCard,
  isInteractive,
  getCardType
}) {
  return (
    <div className="game-board">
      {board.map((word, index) => {
        const isRevealed = revealedCards.includes(index)
        const cardType = getCardType(index)
        const isSelected = selectedCard === index

        return (
          <div
            key={index}
            className={`
              board-card
              ${isRevealed ? `revealed ${cardType}` : ''}
              ${showKey && !isRevealed ? `key-overlay ${cardType}` : ''}
              ${isSelected ? 'selected' : ''}
              ${isInteractive && !isRevealed ? 'interactive' : ''}
            `}
            onClick={() => {
              if (isInteractive && !isRevealed) {
                onSelectCard(index)
              }
            }}
          >
            <span className="card-word">{word}</span>
            {isRevealed && (
              <div className={`card-reveal ${cardType}`}>
                {cardType === 'assassin' && '💀'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
