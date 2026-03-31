import { motion } from "framer-motion";

export default function IntroScreen({ onStart, onQuick, onDaily, onChallenge, onLeaderboard, onBack, challengeCode }) {
  // If we arrived via a challenge URL, show join UI
  if (challengeCode) {
    return (
      <motion.div
        className="chroma-screen chroma-intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button className="chroma-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="chroma-intro__content">
          <h1 className="chroma-title">CHROMA</h1>
          <p className="chroma-subtitle">
            You&apos;ve been challenged!
            <br />
            Play the same 3 colors and compare scores.
          </p>

          <div className="chroma-intro__actions">
            <button className="chroma-play-btn" onClick={onStart}>
              <span className="chroma-play-btn__ring" />
              <span className="chroma-play-btn__label">Play</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="chroma-screen chroma-intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button className="chroma-back-btn" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="chroma-intro__content">
        <h1 className="chroma-title">CHROMA</h1>

        <div className="chroma-how-to">
          <div className="chroma-how-to__step">
            <div className="chroma-how-to__icon">👁️</div>
            <div className="chroma-how-to__label">See a color</div>
          </div>
          <div className="chroma-how-to__arrow">→</div>
          <div className="chroma-how-to__step">
            <div className="chroma-how-to__icon">🎨</div>
            <div className="chroma-how-to__label">Recreate it</div>
          </div>
          <div className="chroma-how-to__arrow">→</div>
          <div className="chroma-how-to__step">
            <div className="chroma-how-to__icon">🎯</div>
            <div className="chroma-how-to__label">Get scored</div>
          </div>
        </div>

        <p className="chroma-subtitle">3 rounds. How well do you remember colors?</p>

        <div className="chroma-intro__actions">
          <button className="chroma-play-btn" onClick={onStart}>
            <span className="chroma-play-btn__ring" />
            <span className="chroma-play-btn__label">Play</span>
          </button>

          <div className="chroma-intro__row">
            <button className="chroma-btn chroma-btn--ghost chroma-btn--quick" onClick={onQuick}>
              Quick
            </button>
            <button className="chroma-btn chroma-btn--daily" onClick={onDaily}>
              Daily Challenge
            </button>
          </div>

          <div className="chroma-intro__row">
            <button className="chroma-btn chroma-btn--ghost chroma-challenge-btn" onClick={onChallenge}>
              Challenge Friends
            </button>
            <button className="chroma-btn chroma-btn--ghost" onClick={onLeaderboard}>
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
