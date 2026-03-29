/**
 * Color conversion and scoring utilities for the Dialed game.
 * HSB ↔ RGB ↔ Lab conversions and CIELAB Delta E scoring.
 */

/**
 * Convert HSB to RGB.
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} b - Brightness (0-100)
 * @returns {[number, number, number]} RGB values (0-255)
 */
export function hsbToRgb(h, s, b) {
  const S = s / 100;
  const V = b / 100;
  const C = V * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = V - C;

  let r, g, bl;
  if (h < 60) {
    r = C; g = X; bl = 0;
  } else if (h < 120) {
    r = X; g = C; bl = 0;
  } else if (h < 180) {
    r = 0; g = C; bl = X;
  } else if (h < 240) {
    r = 0; g = X; bl = C;
  } else if (h < 300) {
    r = X; g = 0; bl = C;
  } else {
    r = C; g = 0; bl = X;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((bl + m) * 255),
  ];
}

/**
 * Convert HSB to a CSS hex color string.
 */
export function hsbToHex(h, s, b) {
  const [r, g, bl] = hsbToRgb(h, s, b);
  return (
    "#" +
    [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

/**
 * Convert HSB to a CSS hsl() string (for gradient use).
 */
export function hsbToCss(h, s, b) {
  return hsbToHex(h, s, b);
}

/**
 * Linearize an sRGB component (0-255) to linear RGB (0-1).
 */
function linearize(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB to CIE XYZ (D65 illuminant).
 */
function rgbToXyz(r, g, b) {
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  return [
    lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
    lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750,
    lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041,
  ];
}

/**
 * Convert CIE XYZ to CIELAB.
 */
function xyzToLab(x, y, z) {
  // D65 reference white
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  const f = (t) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Convert RGB (0-255) to CIELAB.
 */
export function rgbToLab(r, g, b) {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

/**
 * Calculate CIELAB Delta E (CIE76) between two Lab colors.
 */
export function deltaE(lab1, lab2) {
  return Math.sqrt(
    (lab1[0] - lab2[0]) ** 2 +
    (lab1[1] - lab2[1]) ** 2 +
    (lab1[2] - lab2[2]) ** 2
  );
}

/**
 * Calculate the angular distance between two hues (0-180).
 */
function hueDistance(h1, h2) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/**
 * Score a guess against a target color using perceptual distance.
 * @param {[number, number, number]} target - Target [h, s, b]
 * @param {[number, number, number]} guess - Player's guess [h, s, b]
 * @returns {number} Score 0-100 (one decimal place)
 */
export function calculateScore(target, guess) {
  const targetRgb = hsbToRgb(...target);
  const guessRgb = hsbToRgb(...guess);
  const targetLab = rgbToLab(...targetRgb);
  const guessLab = rgbToLab(...guessRgb);

  const dE = deltaE(targetLab, guessLab);

  // Base score: sigmoid curve, 0-100 scale
  // dE ~3 = barely noticeable, dE ~30 = clearly different, dE ~60+ = way off
  let score = 100 / (1 + Math.pow(dE / 30, 1.4));

  // Hue-aware adjustments
  const hueDist = hueDistance(target[0], guess[0]);

  if (hueDist <= 15) {
    score = Math.min(100, score * 1.05);
  } else if (hueDist > 40) {
    score *= 0.85;
  }

  // Recovery bonus for saturated colors (they're harder)
  const avgSat = (target[1] + guess[1]) / 2;
  if (avgSat > 70 && score > 50) {
    score = Math.min(100, score * 1.02);
  }

  return Math.round(score * 10) / 10;
}
