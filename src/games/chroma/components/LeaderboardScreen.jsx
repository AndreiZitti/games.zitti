import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ColorSwatch from "./ColorSwatch";
import { formatDailyChallengeDate } from "../utils/daily";
import { qualifiesForDailyTopThree } from "../utils/leaderboard";

export default function LeaderboardScreen({
  rounds,
  totalScore,
  leaderboard,
  leaderboardLoading,
  leaderboardReady,
  leaderboardError,
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
  const [saveError, setSaveError] = useState(false);
  const autoSaveAttempted = useRef(false);

  const handleCopy = () => {
    if (onShare) {
      onShare();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!editName.trim() || saving) return;
    autoSaveAttempted.current = true;
    setSaving(true);
    setSaveError(false);
    const ok = await onSaveScore(editName.trim());
    if (ok) {
      setSaved(true);
    } else {
      setSaveError(true);
    }
    setSaving(false);
  };

  const avgScore = Math.round(totalScore / rounds.length);

  const sorted = [...leaderboard]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, isDaily ? 3 : 100);
  const hasPlayerName = Boolean(userName?.trim());
  const isUnnamedDailyPlayer = isDaily && !hasPlayerName;
  const guestQualifies =
    isUnnamedDailyPlayer &&
    leaderboardReady &&
    !leaderboardLoading &&
    !leaderboardError &&
    qualifiesForDailyTopThree(totalScore, sorted);

  useEffect(() => {
    if (!isDaily || !userName?.trim() || autoSaveAttempted.current) return;

    autoSaveAttempted.current = true;
    let active = true;
    setSaving(true);
    setSaveError(false);

    onSaveScore(userName.trim()).then((ok) => {
      if (!active) return;
      setSaved(ok);
      setSaveError(!ok);
      setSaving(false);
    });

    return () => {
      active = false;
    };
  }, [isDaily, onSaveScore, userName]);

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
            {formatDailyChallengeDate(challengeCode)} · UTC
          </div>
        )}

        <div className="chroma-leaderboard__your-score">
          <div className="chroma-leaderboard__label">YOUR SCORE</div>
          <div className="chroma-leaderboard__score-row">
            <span className="chroma-leaderboard__total">{avgScore}</span>
            <span className="chroma-leaderboard__max">/ 100</span>
          </div>
          <div className="chroma-leaderboard__scoring-note">
            Perceptual match score · CIEDE2000
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

        {/* Named daily players save automatically. Guests are only asked for
            a first name when they strictly qualify for the Top 3. */}
        {onSaveScore && (!isUnnamedDailyPlayer || guestQualifies) && (
          <motion.div
            className={`chroma-leaderboard__save-row ${
              guestQualifies ? "chroma-leaderboard__save-row--qualified" : ""
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {saved ? (
              <div className="chroma-leaderboard__saved-msg">Best score saved!</div>
            ) : saveError ? (
              <>
                <span className="chroma-leaderboard__saved-msg chroma-leaderboard__saved-msg--error">
                  Save failed — try again
                </span>
                <button
                  className="chroma-btn chroma-btn--primary chroma-leaderboard__save-btn"
                  onClick={handleSave}
                >Retry</button>
              </>
            ) : isDaily && hasPlayerName ? (
              <div className="chroma-leaderboard__saved-msg">
                Saving your best score…
              </div>
            ) : (
              <>
                {guestQualifies && (
                  <div className="chroma-leaderboard__qualification-msg">
                    You made today’s Top 3! Add your first name to join it.
                  </div>
                )}
                <div className="chroma-leaderboard__save-fields">
                  <input
                    className="chroma-leaderboard__name-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={guestQualifies ? "First name" : "Your name"}
                    aria-label={guestQualifies ? "First name" : "Your name"}
                    autoComplete="given-name"
                    maxLength={32}
                  />
                  <button
                    className="chroma-btn chroma-btn--primary chroma-leaderboard__save-btn"
                    onClick={handleSave}
                    disabled={!editName.trim() || saving}
                  >
                    {saving ? "Saving…" : guestQualifies ? "Join Top 3" : "Save Score"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {isUnnamedDailyPlayer &&
          !leaderboardError &&
          (!leaderboardReady || leaderboardLoading) && (
            <div className="chroma-leaderboard__saved-msg">
              Checking today’s Top 3…
            </div>
          )}

        {isChallenge && sorted.length > 0 && (
          <motion.div
            className="chroma-leaderboard__list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="chroma-leaderboard__list-title">
              {isDaily ? "Global Daily Top 3" : "Leaderboard"}
            </div>
            {sorted.map((entry, i) => (
              <div
                key={entry.player_id}
                className={`chroma-leaderboard__entry ${
                  i === 0 ? "chroma-leaderboard__entry--first" : ""
                }`}
              >
                <span className="chroma-leaderboard__rank">
                  {isDaily ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </span>
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

        {isDaily &&
          !saving &&
          !leaderboardError &&
          !guestQualifies &&
          sorted.length === 0 && (
          <div className="chroma-leaderboard__saved-msg">
            No scores yet today. Yours can be first.
          </div>
        )}

        {leaderboardError && (
          <div className="chroma-leaderboard__saved-msg chroma-leaderboard__saved-msg--error">
            Leaderboard unavailable. Your score was not lost locally.
          </div>
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
