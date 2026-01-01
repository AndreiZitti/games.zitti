import { useState, useRef, useEffect } from "react";

export function WhistBidModal({
  round,
  players,
  onSaveBids,
  onSaveTricks,
  onRevert,
  onClose,
}) {
  const { cards, phase, bids: initialBids, tricks: initialTricks, isEditing, roundIndex } = round;

  // For editing mode, allow switching between bids and tricks
  const [editMode, setEditMode] = useState(isEditing ? 'tricks' : null);

  const [bids, setBids] = useState(
    initialBids?.map(b => b ?? 0) || players.map(() => 0)
  );
  const [tricks, setTricks] = useState(
    initialTricks?.map(t => t ?? 0) || players.map(() => 0)
  );

  // Calculate player order based on who goes first this round
  const firstPlayerIndex = roundIndex % players.length;
  const playerOrder = Array.from({ length: players.length }, (_, i) =>
    (firstPlayerIndex + i) % players.length
  );

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
      firstInputRef.current.select();
    }
  }, [phase, editMode]);

  const handleBidChange = (index, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= cards) {
      setBids((prev) => {
        const next = [...prev];
        next[index] = numValue;
        return next;
      });
    }
  };

  const handleTricksChange = (index, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= cards) {
      setTricks((prev) => {
        const next = [...prev];
        next[index] = numValue;
        return next;
      });
    }
  };

  const totalBids = bids.reduce((sum, b) => sum + b, 0);
  const totalTricks = tricks.reduce((sum, t) => sum + t, 0);

  // Bids must NOT add up to cards (last bidder rule)
  const bidsInvalid = totalBids === cards;
  const tricksValid = totalTricks === cards;

  // Calculate preview scores
  const calculateScores = () => {
    return players.map((_, i) => {
      const bid = bids[i];
      const trick = tricks[i];
      if (bid === trick) {
        return 5 + trick;
      }
      return -Math.abs(bid - trick);
    });
  };

  const previewScores = (phase === 'tricks' || isEditing) ? calculateScores() : [];

  const handleKeyDown = (e, index, field) => {
    if (e.key === "Enter") {
      const totalInputs = players.length;
      if (index < totalInputs - 1) {
        const nextInput = document.querySelector(`[data-${field}-index="${index + 1}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // Last input - try to save or move to next phase
        if ((phase === 'bidding' || editMode === 'bids') && !bidsInvalid) {
          if (isEditing) {
            setEditMode('tricks');
          } else {
            onSaveBids(bids);
          }
        } else if ((phase === 'tricks' || editMode === 'tricks') && tricksValid) {
          onSaveTricks(tricks);
        }
      }
    }
  };

  // Editing mode - show tabs for bids/tricks
  if (isEditing) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content whist-bid-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Round: {cards} Card{cards !== 1 ? 's' : ''} - Edit</h3>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          {/* Tab switcher */}
          <div className="edit-tabs">
            <button
              className={`edit-tab ${editMode === 'bids' ? 'active' : ''}`}
              onClick={() => setEditMode('bids')}
            >
              Bids
            </button>
            <button
              className={`edit-tab ${editMode === 'tricks' ? 'active' : ''}`}
              onClick={() => setEditMode('tricks')}
            >
              Tricks
            </button>
          </div>

          <div className="modal-body">
            {editMode === 'bids' ? (
              <>
                <div className="whist-input-table">
                  {playerOrder.map((playerIdx, orderIdx) => (
                    <div key={playerIdx} className="whist-input-row">
                      <label className="player-label">
                        {orderIdx === 0 && <span className="first-marker">1st</span>}
                        {players[playerIdx]}
                      </label>
                      <div className="bid-input-wrapper">
                        <input
                          ref={orderIdx === 0 ? firstInputRef : null}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={cards}
                          data-bid-index={orderIdx}
                          className="whist-number-input"
                          value={bids[playerIdx]}
                          onChange={(e) => handleBidChange(playerIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, orderIdx, 'bid')}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`whist-total ${bidsInvalid ? 'invalid' : 'valid'}`}>
                  Total Bids: {totalBids} / {cards}
                  {bidsInvalid && (
                    <span className="whist-error"> - Cannot equal {cards}!</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="whist-input-table with-preview">
                  <div className="whist-table-header">
                    <span className="player-label">Player</span>
                    <span className="bid-col-header">Bid</span>
                    <span className="tricks-col-header">Tricks</span>
                    <span className="score-col-header">Pts</span>
                  </div>

                  {playerOrder.map((playerIdx, orderIdx) => (
                    <div key={playerIdx} className="whist-input-row">
                      <label className="player-label">
                        {orderIdx === 0 && <span className="first-marker">1st</span>}
                        {players[playerIdx]}
                      </label>
                      <span className="bid-display">{bids[playerIdx]}</span>
                      <div className="tricks-input-wrapper">
                        <input
                          ref={orderIdx === 0 ? firstInputRef : null}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={cards}
                          data-tricks-index={orderIdx}
                          className="whist-number-input"
                          value={tricks[playerIdx]}
                          onChange={(e) => handleTricksChange(playerIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, orderIdx, 'tricks')}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <span className={`score-preview ${previewScores[playerIdx] >= 0 ? 'positive' : 'negative'}`}>
                        {previewScores[playerIdx] >= 0 ? '+' : ''}{previewScores[playerIdx]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`whist-total ${tricksValid ? 'valid' : 'invalid'}`}>
                  Total Tricks: {totalTricks} / {cards}
                  {!tricksValid && (
                    <span className="whist-error"> - Must equal {cards}</span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onSaveTricks(tricks, bids)}
              disabled={!tricksValid || bidsInvalid}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bidding phase UI (normal flow)
  if (phase === 'bidding') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content whist-bid-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Round: {cards} Card{cards !== 1 ? 's' : ''} - Enter Bids</h3>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="whist-input-table">
              {playerOrder.map((playerIdx, orderIdx) => (
                <div key={playerIdx} className="whist-input-row">
                  <label className="player-label">
                    {orderIdx === 0 && <span className="first-marker">1st</span>}
                    {players[playerIdx]}
                  </label>
                  <div className="bid-input-wrapper">
                    <input
                      ref={orderIdx === 0 ? firstInputRef : null}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={cards}
                      data-bid-index={orderIdx}
                      className="whist-number-input"
                      value={bids[playerIdx]}
                      onChange={(e) => handleBidChange(playerIdx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, orderIdx, 'bid')}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={`whist-total ${bidsInvalid ? 'invalid' : 'valid'}`}>
              Total Bids: {totalBids} / {cards}
              {bidsInvalid && (
                <span className="whist-error"> - Cannot equal {cards}!</span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onSaveBids(bids)}
              disabled={bidsInvalid}
            >
              Confirm Bids
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tricks phase UI (normal flow)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content whist-bid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Round: {cards} Card{cards !== 1 ? 's' : ''} - Enter Tricks</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="whist-input-table with-preview">
            <div className="whist-table-header">
              <span className="player-label">Player</span>
              <span className="bid-col-header">Bid</span>
              <span className="tricks-col-header">Tricks</span>
              <span className="score-col-header">Pts</span>
            </div>

            {playerOrder.map((playerIdx, orderIdx) => (
              <div key={playerIdx} className="whist-input-row">
                <label className="player-label">
                  {orderIdx === 0 && <span className="first-marker">1st</span>}
                  {players[playerIdx]}
                </label>
                <span className="bid-display">{bids[playerIdx]}</span>
                <div className="tricks-input-wrapper">
                  <input
                    ref={orderIdx === 0 ? firstInputRef : null}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max={cards}
                    data-tricks-index={orderIdx}
                    className="whist-number-input"
                    value={tricks[playerIdx]}
                    onChange={(e) => handleTricksChange(playerIdx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, orderIdx, 'tricks')}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <span className={`score-preview ${previewScores[playerIdx] >= 0 ? 'positive' : 'negative'}`}>
                  {previewScores[playerIdx] >= 0 ? '+' : ''}{previewScores[playerIdx]}
                </span>
              </div>
            ))}
          </div>

          <div className={`whist-total ${tricksValid ? 'valid' : 'invalid'}`}>
            Total Tricks: {totalTricks} / {cards}
            {!tricksValid && (
              <span className="whist-error"> - Must equal {cards}</span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-text" onClick={onRevert}>
            &larr; Back to Bids
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSaveTricks(tricks)}
            disabled={!tricksValid}
          >
            Complete Round
          </button>
        </div>
      </div>
    </div>
  );
}
