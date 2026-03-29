import { useRef, useCallback } from "react";
import { hsbToHex } from "../utils/color";

export default function HsbSlider({
  type,
  value,
  onChange,
  hue,
  saturation,
  brightness,
}) {
  const trackRef = useRef(null);

  const getRange = () => (type === "hue" ? 360 : 100);

  const valueToPercent = (val) => {
    const range = getRange();
    return (val / range) * 100;
  };

  const positionToValue = useCallback(
    (clientY) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const percent = y / rect.height;
      const range = getRange();
      return Math.round(percent * range);
    },
    [type, value]
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      const track = trackRef.current;
      if (!track) return;
      track.setPointerCapture(e.pointerId);
      onChange(positionToValue(e.clientY));
    },
    [onChange, positionToValue]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const track = trackRef.current;
      if (!track || !track.hasPointerCapture(e.pointerId)) return;
      onChange(positionToValue(e.clientY));
    },
    [onChange, positionToValue]
  );

  const handlePointerUp = useCallback(
    (e) => {
      const track = trackRef.current;
      if (!track) return;
      if (track.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }
    },
    []
  );

  const buildGradient = () => {
    if (type === "hue") {
      return `linear-gradient(to bottom,
        hsl(0, 100%, 50%),
        hsl(30, 100%, 50%),
        hsl(60, 100%, 50%),
        hsl(90, 100%, 50%),
        hsl(120, 100%, 50%),
        hsl(150, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(210, 100%, 50%),
        hsl(240, 100%, 50%),
        hsl(270, 100%, 50%),
        hsl(300, 100%, 50%),
        hsl(330, 100%, 50%),
        hsl(360, 100%, 50%)
      )`;
    }
    if (type === "saturation") {
      const low = hsbToHex(hue, 0, brightness);
      const high = hsbToHex(hue, 100, brightness);
      return `linear-gradient(to bottom, ${low}, ${high})`;
    }
    const low = hsbToHex(hue, saturation, 0);
    const high = hsbToHex(hue, saturation, 100);
    return `linear-gradient(to bottom, ${low}, ${high})`;
  };

  const thumbColor = hsbToHex(
    type === "hue" ? value : hue,
    type === "saturation" ? value : saturation,
    type === "brightness" ? value : brightness
  );

  const label =
    type === "hue" ? "HUE" : type === "saturation" ? "SAT" : "BRI";

  return (
    <div className="chroma-slider">
      <div
        ref={trackRef}
        className="chroma-slider__track"
        style={{ background: buildGradient() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="chroma-slider__thumb"
          style={{
            top: `${valueToPercent(value)}%`,
            backgroundColor: thumbColor,
          }}
        />
      </div>
      <div className="chroma-slider__label">{label}</div>
    </div>
  );
}
