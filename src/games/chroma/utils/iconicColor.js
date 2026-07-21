import { hsbToRgb } from "./color.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rgbToHsb(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;
  return [hue, max === 0 ? 0 : (delta / max) * 100, max * 100];
}

export function recolorHsbForPixel(sourceHsb, targetHsb, pickerHsb) {
  const [, sourceSaturation, sourceBrightness] = sourceHsb;
  const [, targetSaturation, targetBrightness] = targetHsb;
  const [pickerHue, pickerSaturation, pickerBrightness] = pickerHsb;
  const saturationDetail = (sourceSaturation - targetSaturation) * 0.35;
  const brightnessRatio = sourceBrightness / Math.max(1, targetBrightness);

  return [
    pickerHue,
    clamp(pickerSaturation + saturationDetail, 0, 100),
    clamp(pickerBrightness * brightnessRatio, 0, 100),
  ];
}

export function recolorRgbPixel(r, g, b, targetHsb, pickerHsb) {
  return hsbToRgb(...recolorHsbForPixel(rgbToHsb(r, g, b), targetHsb, pickerHsb));
}
