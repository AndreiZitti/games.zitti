import { useState } from "react";

export function RentzSetup({ defaultConfig, onStart, onBack }) {
  const [config, setConfig] = useState(defaultConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setConfig((prev) => ({ ...prev, [key]: numValue }));
    }
  };

  const handlePlacementChange = (index, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setConfig((prev) => {
        const newPlacements = [...prev.rentzPlacement];
        newPlacements[index] = numValue;
        return { ...prev, rentzPlacement: newPlacements };
      });
    }
  };

  const handleSubmit = () => {
    onStart(config);
  };

  return (
    <div className="rentz-setup">
      <div className="rentz-setup-header">
        <button className="btn-back" onClick={onBack}>
          &larr;
        </button>
        <h2>Rentz Scoring</h2>
      </div>

      <p className="setup-subtitle">Configure point values for each mini-game</p>

      <div className="rentz-config-grid">
        {/* Trick-based games */}
        <div className="config-section">
          <h3 className="config-section-title">Trick Games</h3>

          <div className="config-row">
            <label className="config-label">
              <span className="config-icon positive">W+</span>
              <span className="config-name">Whist +</span>
            </label>
            <div className="config-input-wrapper">
              <span className="config-prefix">+</span>
              <input
                type="number"
                className="config-input"
                value={config.whistPoints}
                onChange={(e) => handleChange("whistPoints", e.target.value)}
              />
              <span className="config-suffix">/trick</span>
            </div>
          </div>

          <div className="config-row">
            <label className="config-label">
              <span className="config-icon negative">W-</span>
              <span className="config-name">Whist -</span>
            </label>
            <div className="config-input-wrapper">
              <span className="config-prefix">-</span>
              <input
                type="number"
                className="config-input"
                value={config.whistPoints}
                onChange={(e) => handleChange("whistPoints", e.target.value)}
                disabled
              />
              <span className="config-suffix">/trick</span>
            </div>
          </div>
        </div>

        {/* Card-based games */}
        <div className="config-section">
          <h3 className="config-section-title">Card Games</h3>

          <div className="config-row">
            <label className="config-label">
              <span className="config-icon negative diamond">&#9830;</span>
              <span className="config-name">Diamonds</span>
            </label>
            <div className="config-input-wrapper">
              <input
                type="number"
                className="config-input negative"
                value={config.diamondPoints}
                onChange={(e) => handleChange("diamondPoints", e.target.value)}
              />
              <span className="config-suffix">/card</span>
            </div>
          </div>

          <div className="config-row">
            <label className="config-label">
              <span className="config-icon negative">&#9813;</span>
              <span className="config-name">Queens</span>
            </label>
            <div className="config-input-wrapper">
              <input
                type="number"
                className="config-input negative"
                value={config.queenPoints}
                onChange={(e) => handleChange("queenPoints", e.target.value)}
              />
              <span className="config-suffix">/queen</span>
            </div>
          </div>
        </div>

        {/* Single card games */}
        <div className="config-section">
          <h3 className="config-section-title">Special Cards</h3>

          <div className="config-row">
            <label className="config-label">
              <span className="config-icon negative heart">K&#9829;</span>
              <span className="config-name">King of Hearts</span>
            </label>
            <div className="config-input-wrapper">
              <input
                type="number"
                className="config-input negative"
                value={config.kingHeartsPoints}
                onChange={(e) => handleChange("kingHeartsPoints", e.target.value)}
              />
            </div>
          </div>

          <div className="config-row">
            <label className="config-label">
              <span className="config-icon positive club">10&#9827;</span>
              <span className="config-name">10 of Clubs</span>
            </label>
            <div className="config-input-wrapper">
              <span className="config-prefix">+</span>
              <input
                type="number"
                className="config-input"
                value={config.tenClubsPoints}
                onChange={(e) => handleChange("tenClubsPoints", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Rentz placement */}
        <div className="config-section">
          <h3 className="config-section-title">Rentz (Domino)</h3>

          <div className="placement-grid">
            {["1st", "2nd", "3rd", "4th"].map((place, index) => (
              <div key={index} className="placement-row">
                <label className="placement-label">{place}</label>
                <div className="config-input-wrapper">
                  <span className="config-prefix">+</span>
                  <input
                    type="number"
                    className="config-input placement-input"
                    value={config.rentzPlacement[index]}
                    onChange={(e) => handlePlacementChange(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rentz-setup-actions">
        <button className="btn btn-secondary" onClick={() => setConfig(defaultConfig)}>
          Reset to Defaults
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          Start Game
        </button>
      </div>
    </div>
  );
}
