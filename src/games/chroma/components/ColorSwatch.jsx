import { hsbToHex } from "../utils/color";

export default function ColorSwatch({
  color,
  targetColor,
  guessColor,
  size = "large",
}) {
  const isSplit = targetColor && guessColor;
  const sizeClass = size === "small" ? "chroma-swatch--small" : "";

  if (isSplit) {
    return (
      <div className={`chroma-swatch chroma-swatch--split ${sizeClass}`}>
        <div
          className="chroma-swatch__target"
          style={{ backgroundColor: hsbToHex(...targetColor) }}
        />
        <div
          className="chroma-swatch__guess"
          style={{ backgroundColor: hsbToHex(...guessColor) }}
        />
        <div className="chroma-swatch__divider" />
      </div>
    );
  }

  return (
    <div
      className={`chroma-swatch ${sizeClass}`}
      style={{ backgroundColor: hsbToHex(...color) }}
    />
  );
}
