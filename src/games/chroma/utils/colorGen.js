/**
 * Color generation for the Dialed game.
 */

/**
 * Generate a random HSB color with S and B in the 15-100 range
 * to avoid near-black/fully-gray colors.
 */
export function randomHsb() {
  return [
    Math.floor(Math.random() * 360),
    15 + Math.floor(Math.random() * 86),
    15 + Math.floor(Math.random() * 86),
  ];
}

/**
 * Generate 3 random colors for a game.
 */
export function generateGameColors() {
  return Array.from({ length: 3 }, () => randomHsb());
}

/**
 * Generate an initial picker HSB that is deliberately offset from the target.
 * Hue is at least 60° away, S and B are random within range.
 */
export function initialPickerHsb(targetHsb) {
  const offsetHue =
    (targetHsb[0] + 60 + Math.floor(Math.random() * 240)) % 360;
  const offsetSat = 15 + Math.floor(Math.random() * 86);
  const offsetBri = 15 + Math.floor(Math.random() * 86);
  return [offsetHue, offsetSat, offsetBri];
}

/**
 * Generate a random vivid color for hard-mode countdown backgrounds.
 * High saturation + brightness to ensure visibility.
 */
export function randomVividHsb() {
  return [
    Math.floor(Math.random() * 360),
    60 + Math.floor(Math.random() * 41),
    60 + Math.floor(Math.random() * 41),
  ];
}
