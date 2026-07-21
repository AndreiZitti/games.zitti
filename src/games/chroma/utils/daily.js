import { createSeededRandom } from "../../../lib/random.js";

const DAILY_PREFIX = "daily-";

export function seededGameColors(seed) {
  const rng = createSeededRandom(seed);
  return Array.from({ length: 3 }, () => [
    Math.floor(rng() * 360),
    15 + Math.floor(rng() * 86),
    15 + Math.floor(rng() * 86),
  ]);
}

export function getDailyChallengeDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallengeCode(date = new Date()) {
  return `${DAILY_PREFIX}${getDailyChallengeDate(date)}`;
}

export function isDailyChallengeCode(code) {
  return /^daily-\d{4}-\d{2}-\d{2}$/.test(code || "");
}

export function formatDailyChallengeDate(code, locale) {
  const dateKey = isDailyChallengeCode(code)
    ? code.slice(DAILY_PREFIX.length)
    : getDailyChallengeDate();
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
