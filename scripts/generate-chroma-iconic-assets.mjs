import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ASSET_DIR = path.join(ROOT, "public/games/chroma/iconic");

const SUBJECTS = [
  {
    id: "homer",
    file: "homer.jpg",
    seeds: [[0.34, 0.09], [0.58, 0.27], [0.73, 0.58]],
    isCandidate: ({ h, s, v, x, y, width, height }) => {
      const inMainCharacter =
        (x > width * 0.24 && x < width * 0.83 && y < height * 0.73) ||
        (x > width * 0.62 && x < width * 0.82 && y < height * 0.82);
      return inMainCharacter && h >= 38 && h <= 72 && s >= 24 && v >= 28;
    },
  },
  {
    id: "shrek",
    file: "shrek.jpg",
    seeds: [[0.5, 0.42]],
    isCandidate: ({ h, s, v, x, y, width, height }) => {
      const nx = x / width;
      const ny = y / height;
      const head = Math.pow((nx - 0.5) / 0.285, 2) + Math.pow((ny - 0.43) / 0.43, 2) <= 1;
      const leftEar = nx > 0.2 && nx < 0.43 && ny > 0.05 && ny < 0.37;
      const rightEar = nx > 0.58 && nx < 0.81 && ny > 0.03 && ny < 0.38;
      const neck = nx > 0.34 && nx < 0.66 && ny > 0.6 && ny < 0.9;
      return (head || leftEar || rightEar || neck) && h >= 40 && h <= 72 && s >= 34 && v >= 18;
    },
  },
  {
    id: "spongebob",
    file: "spongebob.jpg",
    seeds: [[0.5, 0.34], [0.3, 0.61], [0.7, 0.61]],
    isCandidate: ({ h, s, v, x, y, width, height }) => {
      const nx = x / width;
      const ny = y / height;
      const body = nx > 0.26 && nx < 0.72 && ny > 0.2 && ny < 0.69;
      const arms = nx > 0.2 && nx < 0.79 && ny > 0.43 && ny < 0.65;
      return (body || arms) && h >= 43 && h <= 82 && s >= 38 && v >= 32;
    },
  },
  {
    id: "pikachu",
    file: "pikachu.jpg",
    seeds: [
      [0.5, 0.22], [0.5, 0.67], [0.5, 0.95],
      [0.11, 0.2], [0.07, 0.64], [0.91, 0.09],
    ],
    isCandidate: ({ h, s, v, x, y, width, height }) => {
      const nx = x / width;
      const ny = y / height;
      const character = nx < 0.98 && ny < 0.99;
      return character && h >= 43 && h <= 68 && s >= 28 && v >= 44;
    },
  },
];

function rgbToHsv(r, g, b) {
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
  return {
    h: hue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function nearestCandidate(seedX, seedY, candidates, width, height) {
  for (let radius = 0; radius <= 30; radius += 1) {
    for (let y = Math.max(0, seedY - radius); y <= Math.min(height - 1, seedY + radius); y += 1) {
      for (let x = Math.max(0, seedX - radius); x <= Math.min(width - 1, seedX + radius); x += 1) {
        if (candidates[y * width + x]) return [x, y];
      }
    }
  }
  return null;
}

function connectedMask(candidates, width, height, normalizedSeeds) {
  const mask = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueStart = 0;
  let queueEnd = 0;

  for (const [normalizedX, normalizedY] of normalizedSeeds) {
    const seed = nearestCandidate(
      Math.round(normalizedX * (width - 1)),
      Math.round(normalizedY * (height - 1)),
      candidates,
      width,
      height,
    );
    if (!seed) continue;
    const index = seed[1] * width + seed[0];
    if (!mask[index]) {
      mask[index] = 255;
      queue[queueEnd++] = index;
    }
  }

  while (queueStart < queueEnd) {
    const index = queue[queueStart++];
    const x = index % width;
    const y = Math.floor(index / width);
    const neighbors = [
      x > 0 ? index - 1 : -1,
      x < width - 1 ? index + 1 : -1,
      y > 0 ? index - width : -1,
      y < height - 1 ? index + width : -1,
    ];

    for (const neighbor of neighbors) {
      if (neighbor >= 0 && candidates[neighbor] && !mask[neighbor]) {
        mask[neighbor] = 255;
        queue[queueEnd++] = neighbor;
      }
    }
  }

  return mask;
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
}

async function processSubject(subject) {
  const inputPath = path.join(ASSET_DIR, subject.file);
  const { data, info } = await sharp(inputPath)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const candidates = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const dataIndex = pixelIndex * channels;
      const hsv = rgbToHsv(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2]);
      candidates[pixelIndex] = subject.isCandidate({
        ...hsv,
        x,
        y,
        width,
        height,
      }) ? 1 : 0;
    }
  }

  const mask = connectedMask(candidates, width, height, subject.seeds);
  const targetHue = [];
  const targetSaturation = [];
  const targetBrightness = [];

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (!mask[pixelIndex]) continue;
    const dataIndex = pixelIndex * channels;
    const hsv = rgbToHsv(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2]);
    targetHue.push(hsv.h);
    targetSaturation.push(hsv.s);
    targetBrightness.push(hsv.v);
  }

  const targetHsb = [
    Math.round(median(targetHue)),
    Math.round(median(targetSaturation)),
    Math.round(median(targetBrightness)),
  ];

  await sharp(mask, { raw: { width, height, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSET_DIR, `${subject.id}-mask.png`));

  const coverage = (mask.reduce((sum, value) => sum + (value ? 1 : 0), 0) / mask.length) * 100;
  console.log(`${subject.id}: ${width}x${height}, target HSB ${targetHsb.join("/")}, mask ${coverage.toFixed(1)}%`);
}

await mkdir(ASSET_DIR, { recursive: true });
await Promise.all(SUBJECTS.map(processSubject));
