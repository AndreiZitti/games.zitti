import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hsbToHex } from "../utils/color";
import { randomVividHsb } from "../utils/colorGen";

const STEPS = [
  { text: "ready", duration: 800 },
  { text: "set", duration: 800 },
  { text: "go", duration: 1050 },
];

export default function CountdownScreen({
  difficulty,
  targetColor,
  round,
  onComplete,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [bgColor, setBgColor] = useState(
    difficulty === "hard"
      ? hsbToHex(...randomVividHsb())
      : hsbToHex(...targetColor)
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (difficulty === "hard") {
      intervalRef.current = setInterval(() => {
        setBgColor(hsbToHex(...randomVividHsb()));
      }, 300);
      return () => clearInterval(intervalRef.current);
    }
  }, [difficulty]);

  useEffect(() => {
    if (stepIndex >= STEPS.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, STEPS[stepIndex].duration);
    return () => clearTimeout(timer);
  }, [stepIndex, onComplete]);

  const currentStep = STEPS[stepIndex] || STEPS[STEPS.length - 1];
  const isHard = difficulty === "hard";

  return (
    <motion.div
      className={`chroma-screen chroma-countdown ${isHard ? "chroma-countdown--hard" : ""}`}
      style={{ backgroundColor: bgColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="chroma-countdown__round">{round}/5</div>
      <AnimatePresence mode="wait">
        {stepIndex < STEPS.length && (
          <motion.div
            key={currentStep.text}
            className="chroma-countdown__text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {currentStep.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
