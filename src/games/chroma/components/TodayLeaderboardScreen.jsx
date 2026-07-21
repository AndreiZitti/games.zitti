import { motion } from "framer-motion";
import useChromaChallenge from "../hooks/useChromaRoom";
import { formatDailyChallengeDate, getDailyChallengeCode } from "../utils/daily";

export default function TodayLeaderboardScreen({ onBack, onPlayDaily }) {
  const dailyCode = getDailyChallengeCode();
  const { leaderboard, loading, error } = useChromaChallenge(dailyCode);

  const sorted = [...leaderboard]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 3);

  const date = formatDailyChallengeDate(dailyCode);

  return (
    <motion.div
      className="chroma-screen chroma-leaderboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button className="chroma-back-btn" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="chroma-leaderboard__content">
        <div className="chroma-leaderboard__daily-badge">{date} · UTC</div>

        <div className="chroma-leaderboard__list-title">
          Global Daily Top 3
        </div>

        {loading && (
          <div className="chroma-leaderboard__saved-msg">Loading…</div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="chroma-leaderboard__saved-msg">
            No scores yet today. Be the first!
          </div>
        )}

        {error && (
          <div className="chroma-leaderboard__saved-msg chroma-leaderboard__saved-msg--error">
            Could not load today&apos;s leaderboard.
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <div className="chroma-leaderboard__list">
            {sorted.map((entry, i) => (
              <div
                key={entry.player_id}
                className={`chroma-leaderboard__entry ${i === 0 ? "chroma-leaderboard__entry--first" : ""}`}
              >
                <span className="chroma-leaderboard__rank">{["🥇", "🥈", "🥉"][i]}</span>
                <span className="chroma-leaderboard__name">{entry.player_name}</span>
                <span className="chroma-leaderboard__entry-score">
                  {Math.round(entry.total_score / (entry.scores?.length || 1))}
                </span>
              </div>
            ))}
          </div>
        )}

        <motion.button
          className="chroma-btn chroma-btn--primary"
          onClick={onPlayDaily}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Play Today&apos;s Challenge
        </motion.button>
      </div>
    </motion.div>
  );
}
