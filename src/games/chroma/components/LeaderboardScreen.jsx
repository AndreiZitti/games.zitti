import { useState } from "react";
import { motion } from "framer-motion";
import ColorSwatch from "./ColorSwatch";

export default function LeaderboardScreen({
  rounds,
  totalScore,
  leaderboard,
  challengeCode,
  isChallenge,
  isDaily,
  userName,
  onSaveScore,
  onPlayAgain,
  onBack,
  onShare,
}) {
  const [copied, setCopied] = useState(false);
  const [editName, setEditName] = useState(userName || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    if (onShare) {
      onShare();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    await onSaveScore(editName.trim());
    setSaved(true);
    setSaving(false);
  };

  const avgScore = Math.round(totalScore / rounds.length);

  // Sort leaderboard by total_score descending, limit to 100
  const sorted = [...leaderboard]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 100);

  const title = isDaily ? "Daily Challenge" : "Challenge";

  return (
    <motion.div
      className="chroma-screen chroma-leaderboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="chroma-leaderboard__content">
        {isDaily && (
          <div className="chroma-leaderboard__daily-badge">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}

        <div className="chroma-leaderboard__your-score">
          <div className="chroma-leaderboard__label">YOUR SCORE</div>
          <div className="chroma-leaderboard__score-row">
            <span className="chroma-leaderboard__total">{avgScore}</span>
            <span className="chroma-leaderboard__max">/ 100</span>
          </div>
        </div>

        <div className="chroma-leaderboard__swatches">
          {rounds.map((r, i) => (
            <div key={i} className="chroma-final__swatch-card">
              <ColorSwatch
                targetColor={r.target}
                guessColor={r.guess}
                size="small"
              />
              <div className="chroma-final__swatch-score">
                {Math.round(r.score)}
              </div>
            </div>
          ))}
        </div>

        {/* Name entry + save */}
        {onSaveScore && (
          <motion.div
            className="chroma-leaderboard__save-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {saved ? (
              <div className="chroma-leaderboard__saved-msg">Score saved!</div>
            ) : (
              <>
                <input
                  className="chroma-leaderboard__name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  maxLength={32}
                />
                <button
                  className="chroma-btn chroma-btn--primary chroma-leaderboard__save-btn"
                  onClick={handleSave}
                  disabled={!editName.trim() || saving}
                >
                  {saving ? "Saving…" : "Save Score"}
                </button>
              </>
            )}
          </motion.div>
        )}

        {isChallenge && sorted.length > 0 && (
          <motion.div
            className="chroma-leaderboard__list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="chroma-leaderboard__list-title">
              {isDaily ? "Today's Leaderboard" : "Leaderboard"}
            </div>
            {sorted.map((entry, i) => (
              <div
                key={entry.player_id}
                className={`chroma-leaderboard__entry ${
                  i === 0 ? "chroma-leaderboard__entry--first" : ""
                }`}
              >
                <span className="chroma-leaderboard__rank">{i + 1}</span>
                <span className="chroma-leaderboard__name">
                  {entry.player_name}
                </span>
                <span className="chroma-leaderboard__entry-score">
                  {Math.round(entry.total_score / (entry.scores?.length || 1))}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {onShare && (
          <motion.button
            className="chroma-btn chroma-btn--ghost chroma-share-btn"
            onClick={handleCopy}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {copied ? "Link Copied!" : "Challenge Friends"}
          </motion.button>
        )}

        <motion.div
          className="chroma-final__actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <button
            className="chroma-btn chroma-btn--primary"
            onClick={onPlayAgain}
          >
            {isDaily ? "Back" : "Play Again"}
          </button>
          {!isDaily && (
            <button className="chroma-btn chroma-btn--ghost" onClick={onBack}>
              Back
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
