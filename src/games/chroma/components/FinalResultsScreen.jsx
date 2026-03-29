import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ColorSwatch from "./ColorSwatch";

const ANIM_DURATION = 2000;

function quinticEaseOut(t) {
  return 1 - Math.pow(1 - t, 5);
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getTierFeedback(avg) {
  if (avg >= 95) return { tier: "Chromatic God", desc: pick([
    "Your cones have cones. Legendary.",
    "The visible spectrum bows to you.",
    "We need to study your eyes. For science.",
  ])};
  if (avg >= 85) return { tier: "Color Savant", desc: pick([
    "Pantone wants your resume.",
    "You see colors most humans can't.",
    "Genuinely impressive. No notes.",
  ])};
  if (avg >= 75) return { tier: "Sharp Eye", desc: pick([
    "Your monitor is lucky to have you.",
    "You really see color. Respect.",
    "The color wheel is your friend.",
  ])};
  if (avg >= 60) return { tier: "Pretty Good", desc: pick([
    "Better than most! Keep at it.",
    "Your rods and cones are pulling their weight.",
    "Solid performance. Eyes warming up.",
  ])};
  if (avg >= 45) return { tier: "Getting There", desc: pick([
    "Your eyes are warming up. One more round!",
    "You're learning the spectrum. Keep going!",
    "Building that color muscle memory.",
  ])};
  if (avg >= 30) return { tier: "Apprentice", desc: pick([
    "Every color expert started here.",
    "Your journey with color just began!",
    "Practice makes Pantone. Keep playing!",
  ])};
  return { tier: "Rookie", desc: pick([
    "Colors are tricky! Try naming them out loud.",
    "First try? It only gets better from here!",
    "Pro tip: focus on hue first, then brightness.",
  ])};
}

export default function FinalResultsScreen({ rounds, onPlayAgain, onBack }) {
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const avgScore = totalScore / rounds.length;
  const [displayTotal, setDisplayTotal] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      const eased = quinticEaseOut(progress);
      setDisplayTotal(Math.round(eased * avgScore * 10) / 10);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [avgScore]);

  const { tier, desc } = getTierFeedback(avgScore);

  return (
    <motion.div
      className="chroma-screen chroma-final"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="chroma-final__content">
        <motion.div
          className="chroma-final__tier"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {tier}
        </motion.div>

        <div className="chroma-final__score-row">
          <span className="chroma-final__total">{Math.round(displayTotal)}</span>
          <span className="chroma-final__max">/ 100</span>
        </div>

        <motion.div
          className="chroma-final__desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {desc}
        </motion.div>

        <motion.div
          className="chroma-final__swatches"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
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
        </motion.div>

        <motion.div
          className="chroma-final__actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <button
            className="chroma-btn chroma-btn--primary"
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          <button
            className="chroma-btn chroma-btn--ghost"
            onClick={onBack}
          >
            Back
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
