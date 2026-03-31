import { useState } from "react";
import { motion } from "framer-motion";

export default function ChallengeScreen({
  challengeCode,
  onStart,
  onBack,
}) {
  const [copied, setCopied] = useState(false);

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/games/chroma?c=${challengeCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="chroma-screen chroma-challenge-setup"
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

      <div className="chroma-challenge-setup__content">
        <div className="chroma-challenge-setup__icon">🎨</div>
        <h2 className="chroma-challenge-setup__title">Challenge Created</h2>
        <p className="chroma-challenge-setup__desc">
          Share this link with friends.
          <br />
          Everyone plays the same 3 colors!
        </p>

        <div className="chroma-challenge-setup__link-box" onClick={handleCopy}>
          <span className="chroma-challenge-setup__code">{challengeCode}</span>
          <span className="chroma-challenge-setup__copy-hint">
            {copied ? "Copied!" : "Tap to copy link"}
          </span>
        </div>

        <button
          className="chroma-play-btn"
          onClick={onStart}
        >
          <span className="chroma-play-btn__ring" />
          <span className="chroma-play-btn__label">Start</span>
        </button>
      </div>
    </motion.div>
  );
}
