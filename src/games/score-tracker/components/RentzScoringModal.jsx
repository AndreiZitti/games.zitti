import { useState, useEffect, useRef } from "react";

export function RentzScoringModal({
  round,
  players,
  miniGameConfig,
  rentzConfig,
  onSave,
  onBack,
  onClose,
}) {
  const { miniGame, isBlind, dealerIndex } = round;
  const gameInfo = miniGameConfig[miniGame];

  // Deck scales with player count: 8 cards per player, so diamonds = players * 2
  const maxDiamonds = players.length * 2;

  // Initialize state based on game type
  const getInitialState = () => {
    switch (gameInfo.type) {
      case "tricks":
        return { tricks: players.map(() => 0) };
      case "cards":
        return { cards: players.map(() => 0) };
      case "single":
        return { takenBy: null };
      case "placement":
        return { placements: [null, null, null] }; // Only top 3 places
      case "totals":
        if (gameInfo.positive) {
          // Totals+: tricks + diamonds + queens + K♥ + 10♣
          return {
            tricks: players.map(() => 0),
            diamonds: players.map(() => 0),
            queens: players.map(() => 0),
            kingHeartsTakenBy: null,
            tenClubsTakenBy: null,
          };
        } else {
          // Totals-: tricks + diamonds + queens + K♥
          return {
            tricks: players.map(() => 0),
            diamonds: players.map(() => 0),
            queens: players.map(() => 0),
            kingHeartsTakenBy: null,
          };
        }
      default:
        return {};
    }
  };

  const [inputs, setInputs] = useState(getInitialState);
  const [activeSection, setActiveSection] = useState(0);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [activeSection]);

  const handleNumberChange = (field, index, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    setInputs((prev) => {
      const newArray = [...(prev[field] || [])];
      newArray[index] = numValue;
      return { ...prev, [field]: newArray };
    });
  };

  const handleSingleSelect = (field, playerIndex) => {
    setInputs((prev) => ({ ...prev, [field]: playerIndex }));
  };

  const handlePlacementSelect = (place, playerIndex) => {
    setInputs((prev) => {
      const newPlacements = [...prev.placements];
      // Remove player from any existing placement
      const existingPlace = newPlacements.indexOf(playerIndex);
      if (existingPlace !== -1) {
        newPlacements[existingPlace] = null;
      }
      newPlacements[place] = playerIndex;
      return { ...prev, placements: newPlacements };
    });
  };

  const getTotalSum = (field) => {
    return (inputs[field] || []).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Validation
  const isValid = () => {
    switch (gameInfo.type) {
      case "tricks":
        return getTotalSum("tricks") === 8;
      case "cards":
        if (miniGame === "queens") {
          return getTotalSum("cards") === 4;
        }
        return getTotalSum("cards") === maxDiamonds;
      case "single":
        return inputs.takenBy !== null;
      case "placement":
        return inputs.placements.slice(0, 3).every((p) => p !== null); // Only top 3 required
      case "totals":
        if (gameInfo.positive) {
          return (
            getTotalSum("tricks") === 8 &&
            getTotalSum("diamonds") === maxDiamonds &&
            getTotalSum("queens") === 4 &&
            inputs.kingHeartsTakenBy !== null &&
            inputs.tenClubsTakenBy !== null
          );
        } else {
          return (
            getTotalSum("tricks") === 8 &&
            getTotalSum("diamonds") === maxDiamonds &&
            getTotalSum("queens") === 4 &&
            inputs.kingHeartsTakenBy !== null
          );
        }
      default:
        return false;
    }
  };

  const handleSave = () => {
    if (isValid()) {
      onSave(inputs);
    }
  };

  // Render different input types
  const renderTricksInput = (field = "tricks", label = "Tricks") => {
    const total = getTotalSum(field);
    const maxTotal = 8;

    return (
      <div className="scoring-section">
        <h4 className="scoring-section-title">{label}</h4>
        <div className="scoring-inputs">
          {players.map((player, index) => (
            <div key={index} className="scoring-input-row">
              <label className="scoring-player-label">
                {index === dealerIndex && <span className="dealer-dot">●</span>}
                {player}
              </label>
              <div className="scoring-stepper">
                <button
                  className="stepper-btn"
                  onClick={() =>
                    handleNumberChange(field, index, Math.max(0, inputs[field][index] - 1))
                  }
                  disabled={inputs[field][index] <= 0}
                >
                  -
                </button>
                <input
                  ref={index === 0 ? firstInputRef : null}
                  type="number"
                  className="stepper-input"
                  value={inputs[field][index]}
                  onChange={(e) => handleNumberChange(field, index, e.target.value)}
                  min="0"
                  max="8"
                />
                <button
                  className="stepper-btn"
                  onClick={() =>
                    handleNumberChange(field, index, Math.min(maxTotal, inputs[field][index] + 1))
                  }
                  disabled={total >= maxTotal}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={`scoring-total ${total === maxTotal ? "valid" : "invalid"}`}>
          Total: {total}/{maxTotal}
        </div>
      </div>
    );
  };

  const renderCardsInput = (field = "cards", label, maxTotal) => {
    const total = getTotalSum(field);

    return (
      <div className="scoring-section">
        <h4 className="scoring-section-title">{label}</h4>
        <div className="scoring-inputs">
          {players.map((player, index) => (
            <div key={index} className="scoring-input-row">
              <label className="scoring-player-label">
                {index === dealerIndex && <span className="dealer-dot">●</span>}
                {player}
              </label>
              <div className="scoring-stepper">
                <button
                  className="stepper-btn"
                  onClick={() =>
                    handleNumberChange(field, index, Math.max(0, inputs[field][index] - 1))
                  }
                  disabled={inputs[field][index] <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  className="stepper-input"
                  value={inputs[field][index]}
                  onChange={(e) => handleNumberChange(field, index, e.target.value)}
                  min="0"
                  max={maxTotal}
                />
                <button
                  className="stepper-btn"
                  onClick={() =>
                    handleNumberChange(field, index, Math.min(maxTotal, inputs[field][index] + 1))
                  }
                  disabled={total >= maxTotal}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={`scoring-total ${total === maxTotal ? "valid" : "invalid"}`}>
          Total: {total}/{maxTotal}
        </div>
      </div>
    );
  };

  const renderSingleSelect = (field, label) => {
    return (
      <div className="scoring-section">
        <h4 className="scoring-section-title">{label}</h4>
        <div className="scoring-single-select">
          {players.map((player, index) => (
            <button
              key={index}
              className={`single-select-btn ${inputs[field] === index ? "selected" : ""}`}
              onClick={() => handleSingleSelect(field, index)}
            >
              {index === dealerIndex && <span className="dealer-dot">●</span>}
              {player}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderPlacementSelect = () => {
    const placementLabels = ["1st", "2nd", "3rd"];
    const placementPoints = rentzConfig.rentzPlacement;

    return (
      <div className="scoring-section">
        <h4 className="scoring-section-title">Finish Order (Top 3)</h4>
        <div className="placement-select">
          {placementLabels.map((label, place) => (
            <div key={place} className="placement-row">
              <span className="placement-label">
                {label}
                <span className="placement-points">+{placementPoints[place]}</span>
              </span>
              <div className="placement-options">
                {players.map((player, playerIndex) => {
                  const isSelected = inputs.placements[place] === playerIndex;
                  const isUsed = inputs.placements.includes(playerIndex) && !isSelected;

                  return (
                    <button
                      key={playerIndex}
                      className={`placement-btn ${isSelected ? "selected" : ""} ${isUsed ? "used" : ""}`}
                      onClick={() => handlePlacementSelect(place, playerIndex)}
                      disabled={isUsed}
                    >
                      {player}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render content based on game type
  const renderContent = () => {
    switch (gameInfo.type) {
      case "tricks":
        return renderTricksInput();

      case "cards":
        if (miniGame === "queens") {
          return renderCardsInput("cards", "Queens Taken", 4);
        }
        return renderCardsInput("cards", "Diamonds Taken", maxDiamonds);

      case "single":
        const label = miniGame === "kingHearts" ? "Who took the King of Hearts?" : "Who took the 10 of Clubs?";
        return renderSingleSelect("takenBy", label);

      case "placement":
        return renderPlacementSelect();

      case "totals":
        if (gameInfo.positive) {
          // Totals+: tabs for Tricks, Diamonds, Queens, K♥, 10♣
          const sectionsPlus = ["Tricks", "♦", "♕", "K♥", "10♣"];
          return (
            <div className="totals-scoring">
              <div className="totals-tabs">
                {sectionsPlus.map((sec, i) => (
                  <button
                    key={i}
                    className={`totals-tab ${activeSection === i ? "active" : ""}`}
                    onClick={() => setActiveSection(i)}
                  >
                    {sec}
                  </button>
                ))}
              </div>
              {activeSection === 0 && renderTricksInput()}
              {activeSection === 1 && renderCardsInput("diamonds", "Diamonds Taken", maxDiamonds)}
              {activeSection === 2 && renderCardsInput("queens", "Queens Taken", 4)}
              {activeSection === 3 && renderSingleSelect("kingHeartsTakenBy", "Who took K♥?")}
              {activeSection === 4 && renderSingleSelect("tenClubsTakenBy", "Who took 10♣?")}
            </div>
          );
        } else {
          // Totals-: tabs for Whist-, Diamonds, Queens, K♥
          const sections = ["Tricks", "♦", "♕", "K♥"];
          return (
            <div className="totals-scoring">
              <div className="totals-tabs">
                {sections.map((sec, i) => (
                  <button
                    key={i}
                    className={`totals-tab ${activeSection === i ? "active" : ""}`}
                    onClick={() => setActiveSection(i)}
                  >
                    {sec}
                  </button>
                ))}
              </div>
              {activeSection === 0 && renderTricksInput()}
              {activeSection === 1 && renderCardsInput("diamonds", "Diamonds Taken", maxDiamonds)}
              {activeSection === 2 && renderCardsInput("queens", "Queens Taken", 4)}
              {activeSection === 3 && renderSingleSelect("kingHeartsTakenBy", "Who took K♥?")}
            </div>
          );
        }

      default:
        return <p>Unknown game type</p>;
    }
  };

  const isTotals = gameInfo.type === 'totals';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content rentz-scoring-modal ${isTotals ? 'totals-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span className={`game-icon ${gameInfo.positive ? "positive" : "negative"}`}>
              {gameInfo.icon}
            </span>
            {gameInfo.name}
            {isBlind && <span className="blind-badge">2x</span>}
          </h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">{renderContent()}</div>

        <div className="modal-footer">
          <button className="btn btn-text" onClick={onBack}>
            &larr; Change Game
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!isValid()}>
            Save Scores
          </button>
        </div>
      </div>
    </div>
  );
}
