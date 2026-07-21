/**
 * Color conversion and scoring utilities for Chroma.
 * HSB ↔ RGB ↔ Lab conversions and perceptual CIEDE2000 scoring.
 */

export const CHROMA_SCORING_VERSION = 2;

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
 * Calculate perceptual color distance with the CIEDE2000 formula.
 * A result around 1 is barely perceptible; larger values are more different.
 */
export function deltaE2000(lab1, lab2) {
  const [l1, a1, b1] = lab1;
  const [l2, a2, b2] = lab2;
  const degrees = (radians) => radians * (180 / Math.PI);
  const radians = (degreesValue) => degreesValue * (Math.PI / 180);

  const c1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const c2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const averageC = (c1 + c2) / 2;
  const averageC7 = averageC ** 7;
  const g = 0.5 * (1 - Math.sqrt(averageC7 / (averageC7 + 25 ** 7)));

  const a1Prime = (1 + g) * a1;
  const a2Prime = (1 + g) * a2;
  const c1Prime = Math.sqrt(a1Prime ** 2 + b1 ** 2);
  const c2Prime = Math.sqrt(a2Prime ** 2 + b2 ** 2);

  const huePrime = (a, b) => {
    if (a === 0 && b === 0) return 0;
    const hue = degrees(Math.atan2(b, a));
    return hue >= 0 ? hue : hue + 360;
  };

  const h1Prime = huePrime(a1Prime, b1);
  const h2Prime = huePrime(a2Prime, b2);
  const deltaLPrime = l2 - l1;
  const deltaCPrime = c2Prime - c1Prime;

  let deltaHPrimeDegrees = 0;
  if (c1Prime * c2Prime !== 0) {
    deltaHPrimeDegrees = h2Prime - h1Prime;
    if (deltaHPrimeDegrees > 180) deltaHPrimeDegrees -= 360;
    if (deltaHPrimeDegrees < -180) deltaHPrimeDegrees += 360;
  }

  const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime) *
    Math.sin(radians(deltaHPrimeDegrees / 2));
  const averageLPrime = (l1 + l2) / 2;
  const averageCPrime = (c1Prime + c2Prime) / 2;

  let averageHPrime = h1Prime + h2Prime;
  if (c1Prime * c2Prime !== 0) {
    const hueDifference = Math.abs(h1Prime - h2Prime);
    if (hueDifference <= 180) {
      averageHPrime /= 2;
    } else if (averageHPrime < 360) {
      averageHPrime = (averageHPrime + 360) / 2;
    } else {
      averageHPrime = (averageHPrime - 360) / 2;
    }
  }

  const t = 1
    - 0.17 * Math.cos(radians(averageHPrime - 30))
    + 0.24 * Math.cos(radians(2 * averageHPrime))
    + 0.32 * Math.cos(radians(3 * averageHPrime + 6))
    - 0.20 * Math.cos(radians(4 * averageHPrime - 63));
  const deltaTheta = 30 * Math.exp(-(((averageHPrime - 275) / 25) ** 2));
  const averageCPrime7 = averageCPrime ** 7;
  const rC = 2 * Math.sqrt(averageCPrime7 / (averageCPrime7 + 25 ** 7));
  const lightnessOffset = averageLPrime - 50;
  const sL = 1 + (0.015 * lightnessOffset ** 2) / Math.sqrt(20 + lightnessOffset ** 2);
  const sC = 1 + 0.045 * averageCPrime;
  const sH = 1 + 0.015 * averageCPrime * t;
  const rT = -Math.sin(radians(2 * deltaTheta)) * rC;

  const lightnessTerm = deltaLPrime / sL;
  const chromaTerm = deltaCPrime / sC;
  const hueTerm = deltaHPrime / sH;

  return Math.sqrt(
    lightnessTerm ** 2 +
    chromaTerm ** 2 +
    hueTerm ** 2 +
    rT * chromaTerm * hueTerm
  );
}

/**
 * Return both the perceptual distance and its player-facing score.
 * The continuous curve deliberately avoids threshold jumps:
 * ΔE00 0 → 100, 3 → ~95, 5 → ~90, 10 → ~76, 20 → ~48.
 * @param {[number, number, number]} target - Target [h, s, b]
 * @param {[number, number, number]} guess - Player's guess [h, s, b]
 */
export function calculateScoreDetails(target, guess) {
  const targetRgb = hsbToRgb(...target);
  const guessRgb = hsbToRgb(...guess);
  const targetLab = rgbToLab(...targetRgb);
  const guessLab = rgbToLab(...guessRgb);
  const perceptualDistance = deltaE2000(targetLab, guessLab);
  const rawScore = scoreFromPerceptualDistance(perceptualDistance);

  return {
    score: Math.round(Math.max(0, Math.min(100, rawScore)) * 10) / 10,
    distance: Math.round(perceptualDistance * 10) / 10,
  };
}

export function scoreFromPerceptualDistance(distance) {
  const safeDistance = Math.max(0, Number(distance) || 0);
  return 100 * Math.exp(-Math.pow(safeDistance / 25, 1.4));
}

export function calculateScore(target, guess) {
  return calculateScoreDetails(target, guess).score;
}
