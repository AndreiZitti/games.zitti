import { useState, useRef, useEffect } from "react";

export function AddRoundModal({
  gameType,
  players,
  teams,
  isTeamGame,
  config,
  initialScores,
  initialData,
  whistCurrentCards,
  onSave,
  onClose,
  isEditing,
}) {
  const isSeptica = gameType === "septica";
  const isWhist = gameType === "whist";

  const getInitialScores = () => {
    if (initialScores) return initialScores;
    if (isTeamGame) return teams.map(() => 0);
    return players.map(() => 0);
  };

  const [scores, setScores] = useState(getInitialScores);
  const [septicaScore, setSepticaScore] = useState(
    initialScores ? initialScores[0] : 0
  );

  // Whist-specific state
  const [bids, setBids] = useState(
    initialData?.bids || players.map(() => 0)
  );
  const [tricks, setTricks] = useState(
    initialData?.tricks || players.map(() => 0)
  );

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
      firstInputRef.current.select();
    }
  }, []);

  const handleScoreChange = (index, value) => {
    const numValue = value === "" || value === "-" ? value : parseInt(value, 10);
    setScores((prev) => {
      const next = [...prev];
      next[index] = isNaN(numValue) ? prev[index] : numValue;
      return next;
    });
  };

  const handleSepticaScoreChange = (value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 16) {
      setSepticaScore(numValue);
    }
  };

  // Whist handlers
  const handleBidChange = (index, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= whistCurrentCards) {
      setBids((prev) => {
        const next = [...prev];
        next[index] = numValue;
        return next;
      });
    }
  };

  const handleTricksChange = (index, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= whistCurrentCards) {
      setTricks((prev) => {
        const next = [...prev];
        next[index] = numValue;
        return next;
      });
    }
  };

  // Calculate Whist scores
  const calculateWhistScores = () => {
    return players.map((_, i) => {
      const bid = bids[i];
      const trick = tricks[i];
      if (bid === trick) {
        return 5 + trick;
      }
      return -Math.abs(bid - trick);
    });
  };

  const whistScores = isWhist ? calculateWhistScores() : [];
  const totalBids = bids.reduce((sum, b) => sum + b, 0);
  const totalTricks = tricks.reduce((sum, t) => sum + t, 0);
  // Bids must NOT add up to cards (last bidder rule)
  const bidsInvalid = totalBids === whistCurrentCards;
  // Tricks must add up to cards (always true in real play)
  const tricksValid = totalTricks === whistCurrentCards;

  const handleSave = () => {
    if (isSeptica) {
      const team1Score = septicaScore;
      const maxPoints = team1Score === 0 || team1Score === 16 ? 16 : 8;
      const team2Score = maxPoints - team1Score;
      onSave([team1Score, team2Score]);
    } else if (isWhist) {
      const roundData = { bids: [...bids], tricks: [...tricks], cards: whistCurrentCards };
      onSave(whistScores, roundData);
    } else {
      const finalScores = scores.map((s) => (typeof s === "number" ? s : 0));
      onSave(finalScores);
    }
  };

  const handleKeyDown = (e, index, field = "score") => {
    if (e.key === "Enter") {
      if (isSeptica) {
        handleSave();
      } else if (isWhist) {
        // Navigate through bid -> tricks -> next player's bid
        const totalInputs = players.length * 2;
        const currentInputIndex = field === "bid" ? index * 2 : index * 2 + 1;
        if (currentInputIndex < totalInputs - 1) {
          const nextInput = document.querySelector(`[data-whist-index="${currentInputIndex + 1}"]`);
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        } else if (tricksValid && !bidsInvalid) {
          handleSave();
        }
      } else if (index < (isTeamGame ? teams.length : players.length) - 1) {
        const nextInput = document.querySelector(`[data-score-index="${index + 1}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        handleSave();
      }
    }
  };

  const getLabels = () => {
    if (isTeamGame) {
      return teams.map((team) => team[0]);
    }
    return players;
  };

  const labels = getLabels();

  // Whist-specific UI
  if (isWhist) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content whist-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{isEditing ? "Edit Round" : `Round ${whistCurrentCards} Cards`}</h3>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="whist-table">
              <div className="whist-header-row">
                <div className="whist-player-col">Player</div>
                <div className="whist-bid-col">Bid</div>
                <div className="whist-tricks-col">Tricks</div>
                <div className="whist-score-col">Pts</div>
              </div>

              {players.map((player, i) => (
                <div key={i} className="whist-row">
                  <div className="whist-player-col">{player}</div>
                  <div className="whist-bid-col">
                    <input
                      ref={i === 0 ? firstInputRef : null}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={whistCurrentCards}
                      data-whist-index={i * 2}
                      className="whist-input"
                      value={bids[i]}
                      onChange={(e) => handleBidChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i, "bid")}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="whist-tricks-col">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={whistCurrentCards}
                      data-whist-index={i * 2 + 1}
                      className="whist-input"
                      value={tricks[i]}
                      onChange={(e) => handleTricksChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i, "tricks")}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className={`whist-score-col ${whistScores[i] >= 0 ? "positive" : "negative"}`}>
                    {whistScores[i] >= 0 ? "+" : ""}{whistScores[i]}
                  </div>
                </div>
              ))}

              <div className="whist-totals-row">
                <div className="whist-player-col">Total</div>
                <div className={`whist-bid-col ${bidsInvalid ? "invalid" : ""}`}>
                  {totalBids}/{whistCurrentCards}
                </div>
                <div className={`whist-tricks-col ${tricksValid ? "valid" : "invalid"}`}>
                  {totalTricks}/{whistCurrentCards}
                </div>
                <div className="whist-score-col"></div>
              </div>
            </div>

            {bidsInvalid && (
              <p className="whist-warning">
                Bids cannot add up to {whistCurrentCards} (last bidder rule)
              </p>
            )}

            {!tricksValid && !bidsInvalid && (
              <p className="whist-info">
                Tricks: {totalTricks}/{whistCurrentCards}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!tricksValid || bidsInvalid}
            >
              {isEditing ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Septica-specific UI
  if (isSeptica) {
    const team1Name = teams[0]?.[0] || "Team 1";
    const team2Name = teams[1]?.[0] || "Team 2";
    const team2Score = septicaScore === 0 ? 16 : septicaScore === 16 ? 0 : 8 - septicaScore;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{isEditing ? "Edit Round" : "Add Round"}</h3>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <p className="septica-help">
              Enter {team1Name}'s points (0-8, or 16 for shutout)
            </p>

            <div className="septica-score-input">
              <div className="score-input-row">
                <label>{team1Name}</label>
                <input
                  ref={firstInputRef}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="16"
                  className="score-input"
                  value={septicaScore}
                  onChange={(e) => handleSepticaScoreChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="septica-calculated">
                <label>{team2Name}</label>
                <span className="calculated-score">{team2Score}</span>
              </div>
            </div>

            <div className="septica-quick-scores">
              <p className="quick-label">Quick select:</p>
              <div className="quick-buttons">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 16].map((val) => (
                  <button
                    key={val}
                    className={`quick-btn ${septicaScore === val ? "active" : ""}`}
                    onClick={() => setSepticaScore(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {isEditing ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard UI for other games (Rentz, etc.)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? "Edit Round" : "Add Round"}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {labels.map((label, i) => (
            <div key={i} className="score-input-row">
              <label>{label}</label>
              <input
                ref={i === 0 ? firstInputRef : null}
                type="number"
                inputMode="numeric"
                data-score-index={i}
                className="score-input"
                value={scores[i]}
                onChange={(e) => handleScoreChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onFocus={(e) => e.target.select()}
              />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEditing ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
