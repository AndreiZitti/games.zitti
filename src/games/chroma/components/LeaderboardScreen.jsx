import { useState } from "react";
import { motion } from "framer-motion";
import ColorSwatch from "./ColorSwatch";

export default function LeaderboardScreen({
  rounds,
  totalScore,
  leaderboard,
  challengeCode,
  isChallenge,
  onPlayAgain,
  onBack,
  onShare,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sort leaderboard by total_score descending
  const sorted = [...leaderboard].sort((a, b) => b.total_score - a.total_score);

  return (
    <motion.div
      className="chroma-screen chroma-leaderboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="chroma-leaderboard__content">
        <div className="chroma-leaderboard__your-score">
          <div className="chroma-leaderboard__label">YOUR SCORE</div>
          <div className="chroma-leaderboard__score-row">
            <span className="chroma-leaderboard__total">
              {Math.round(totalScore / rounds.length)}
            </span>
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

        {isChallenge && sorted.length > 0 && (
          <motion.div
            className="chroma-leaderboard__list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="chroma-leaderboard__list-title">Leaderboard</div>
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

        {isChallenge && (
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
            Play Again
          </button>
          <button className="chroma-btn chroma-btn--ghost" onClick={onBack}>
            Back
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
