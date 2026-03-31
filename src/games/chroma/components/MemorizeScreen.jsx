import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { hsbToHex } from "../utils/color";

export default function MemorizeScreen({
  targetColor,
  round,
  onComplete,
}) {
  const startCount = 300;
  const duration = 5000;
  const [count, setCount] = useState(startCount);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const remaining = Math.max(0, Math.round(startCount * (1 - progress)));
      setCount(remaining);

      if (remaining <= 0 && !doneRef.current) {
        doneRef.current = true;
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onComplete]);

  const hex = hsbToHex(...targetColor);

  return (
    <motion.div
      className="chroma-screen chroma-memorize"
      style={{ backgroundColor: hex }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="chroma-memorize__round">{round}/3</div>
      <div className="chroma-memorize__hint">
        memorize this color
      </div>
      <div className="chroma-memorize__timer">
        {String(count).length > 1 ? (
          <>
            <span>{String(count).slice(0, -1)}</span>
            <span className="chroma-memorize__timer-last">{String(count).slice(-1)}</span>
          </>
        ) : (
          <span>{count}</span>
        )}
      </div>
      <div className="chroma-memorize__timer-label">TIMER</div>
    </motion.div>
  );
}
