export function Home({ onCreateRoom, onJoinRoom }) {
  return (
    <div className="screen home">
      <h1>Number Line</h1>
      <p className="subtitle">Arrange yourselves in order</p>

      <div className="button-group">
        <button className="btn btn-primary" onClick={onCreateRoom}>
          Create Room
        </button>
        <button className="btn btn-secondary" onClick={onJoinRoom}>
          Join Room
        </button>
      </div>

      <div className="how-to-play">
        <h3>How to Play</h3>
        <ol>
          <li>Everyone joins the same room</li>
          <li>Each player receives a secret number (1-100)</li>
          <li>A category is announced (e.g., "How spicy do you like food?")</li>
          <li>Arrange yourselves based on the category - without revealing your numbers!</li>
          <li>When everyone's in position, reveal to see if you got it right</li>
        </ol>
      </div>
    </div>
  )
}
