import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { hsbToHex } from "../utils/color";

const ANIM_DURATION = 1500;

function quinticEaseOut(t) {
  return 1 - Math.pow(1 - t, 5);
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getFeedback(score) {
  if (score >= 98) return pick([
    "Pixel-perfect. Are you a printer?",
    "Your cones are overclocked.",
    "The color wheel bows to you.",
  ]);
  if (score >= 90) return pick([
    "Mantis shrimp energy.",
    "Pantone would like a word.",
    "Suspiciously accurate. Keep going.",
    "Your retinas are built different.",
  ]);
  if (score >= 75) return pick([
    "You actually see colors. Respect.",
    "Bob Ross would nod approvingly.",
    "That's a trained eye right there.",
    "Your color wheel is well-oiled.",
  ]);
  if (score >= 55) return pick([
    "Close-ish! Squint and it works.",
    "Right vibes, slightly off wavelength.",
    "You're circling it. Getting warmer.",
    "Like the color's cool cousin.",
  ]);
  if (score >= 35) return pick([
    "The spirit was there, the hue wasn't.",
    "Bold guess. Interesting interpretation.",
    "Creative take on that color.",
    "You're seeing colors your own way.",
  ]);
  if (score >= 15) return pick([
    "Adventurous choice! Try again.",
    "That's a whole different vibe, but hey.",
    "Your eyes went on a journey there.",
    "Original interpretation. Very original.",
  ]);
  return pick([
    "You discovered a new color! Wrong one though.",
    "Impressively creative. Artistically wrong.",
    "That's confidence right there. Love it.",
    "Somewhere, a color theory teacher just flinched.",
  ]);
}

function textColorForBg(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
}

function formatHsb(hsb) {
  return `H:${hsb[0]}° S:${hsb[1]}% B:${hsb[2]}%`;
}

export default function RoundResultScreen({
  target,
  guess,
  score,
  round,
  isLastRound,
  onNext,
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      const eased = quinticEaseOut(progress);
      setDisplayScore(Math.round(eased * score * 10) / 10);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const targetHex = hsbToHex(...target);
  const guessHex = hsbToHex(...guess);
  const guessTextColor = textColorForBg(guessHex);
  const targetTextColor = textColorForBg(targetHex);

  return (
    <motion.div
      className="chroma-screen chroma-result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Horizontal split: top = guess, bottom = original */}
      <div className="chroma-result__halves">
        <div
          className="chroma-result__half chroma-result__half--guess"
          style={{ backgroundColor: guessHex }}
        >
          <span className="chroma-result__half-label" style={{ color: guessTextColor }}>
            YOUR PICK
          </span>
          <span className="chroma-result__half-hsb" style={{ color: guessTextColor }}>
            {formatHsb(guess)}
          </span>
        </div>
        <div
          className="chroma-result__half chroma-result__half--target"
          style={{ backgroundColor: targetHex }}
        >
          <span className="chroma-result__half-label" style={{ color: targetTextColor }}>
            ORIGINAL
          </span>
          <span className="chroma-result__half-hsb" style={{ color: targetTextColor }}>
            {formatHsb(target)}
          </span>
        </div>
      </div>

      {/* Score overlay centered */}
      <div className="chroma-result__overlay">
        <div className="chroma-result__round">{round}/3</div>
        <div className="chroma-result__score">
          {Math.round(displayScore)}
        </div>
        <motion.div
          className="chroma-result__feedback"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
        >
          {getFeedback(score)}
        </motion.div>
        <motion.button
          className="chroma-next-btn"
          onClick={onNext}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {isLastRound ? "Results" : "Next"}
        </motion.button>
      </div>
    </motion.div>
  );
}
