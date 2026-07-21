import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateScore,
  calculateScoreDetails,
  deltaE2000,
  scoreFromPerceptualDistance,
} from "../src/games/chroma/utils/color.js";
import {
  getDailyChallengeCode,
  isDailyChallengeCode,
  seededGameColors,
} from "../src/games/chroma/utils/daily.js";
import { qualifiesForDailyTopThree } from "../src/games/chroma/utils/leaderboard.js";
import { ICONIC_SUBJECTS, shuffledIconicSubjects } from "../src/games/chroma/data/iconicSubjects.js";
import { recolorHsbForPixel, rgbToHsb } from "../src/games/chroma/utils/iconicColor.js";

function approximately(actual, expected, tolerance = 0.0001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

test("CIEDE2000 matches published reference pairs", () => {
  approximately(deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]), 2.0425);
  approximately(deltaE2000([50, 3.1571, -77.2803], [50, 0, -82.7485]), 2.8615);
  approximately(deltaE2000([50, 2.8361, -74.0200], [50, 0, -82.7485]), 3.4412);
});

test("the scoring curve is smooth, generous for close matches, and monotonic", () => {
  approximately(scoreFromPerceptualDistance(0), 100);
  assert.ok(scoreFromPerceptualDistance(3) > 94);
  assert.ok(scoreFromPerceptualDistance(5) > 89);
  assert.ok(scoreFromPerceptualDistance(10) > 75);
  assert.ok(scoreFromPerceptualDistance(20) < 50);
  assert.ok(scoreFromPerceptualDistance(30) < scoreFromPerceptualDistance(20));

  const target = [0, 80, 80];
  const beforeOldThreshold = calculateScore(target, [39, 80, 80]);
  const afterOldThreshold = calculateScore(target, [41, 80, 80]);
  assert.ok(Math.abs(beforeOldThreshold - afterOldThreshold) < 5);
});

test("score details respect hue wraparound and identical colors", () => {
  assert.deepEqual(calculateScoreDetails([120, 50, 60], [120, 50, 60]), {
    score: 100,
    distance: 0,
  });

  assert.ok(calculateScore([359, 80, 80], [1, 80, 80]) > 98);
  assert.ok(calculateScore([20, 80, 80], [200, 80, 80]) < 25);
});

test("daily challenge codes and colors are deterministic in UTC", () => {
  const date = new Date("2026-07-21T23:59:59.000Z");
  const code = getDailyChallengeCode(date);
  assert.equal(code, "daily-2026-07-21");
  assert.equal(isDailyChallengeCode(code), true);
  assert.deepEqual(seededGameColors(code), seededGameColors(code));
  assert.notDeepEqual(seededGameColors(code), seededGameColors("daily-2026-07-22"));

  for (const [hue, saturation, brightness] of seededGameColors(code)) {
    assert.ok(hue >= 0 && hue <= 359);
    assert.ok(saturation >= 15 && saturation <= 100);
    assert.ok(brightness >= 15 && brightness <= 100);
  }
});

test("daily guests are prompted only for a score strictly inside the Top 3", () => {
  const leaderboard = [
    { total_score: 270 },
    { total_score: 250 },
    { total_score: 230 },
  ];

  assert.equal(qualifiesForDailyTopThree(230.1, leaderboard), true);
  assert.equal(qualifiesForDailyTopThree(230, leaderboard), false);
  assert.equal(qualifiesForDailyTopThree(229.9, leaderboard), false);
  assert.equal(qualifiesForDailyTopThree(0.1 + 0.2, [
    { total_score: 1 },
    { total_score: 0.5 },
    { total_score: 0.3 },
  ]), false);
  assert.equal(qualifiesForDailyTopThree(1, leaderboard.slice(0, 2)), true);
});

test("iconic subjects have reusable frame, mask, and scoring metadata", () => {
  assert.equal(ICONIC_SUBJECTS.length, 4);
  for (const subject of ICONIC_SUBJECTS) {
    assert.match(subject.image, /^\/games\/chroma\/iconic\/.+\.jpg$/);
    assert.match(subject.mask, /^\/games\/chroma\/iconic\/.+-mask\.png$/);
    assert.equal(subject.targetHsb.length, 3);
  }

  const ordered = shuffledIconicSubjects(() => 0);
  assert.deepEqual(new Set(ordered.map((subject) => subject.id)), new Set(ICONIC_SUBJECTS.map((subject) => subject.id)));
});

test("iconic recoloring preserves local brightness while applying the picked hue", () => {
  assert.deepEqual(rgbToHsb(255, 0, 0).map(Math.round), [0, 100, 100]);
  const recolored = recolorHsbForPixel([52, 70, 45], [52, 70, 60], [210, 80, 80]);
  assert.equal(recolored[0], 210);
  assert.equal(Math.round(recolored[1]), 80);
  assert.equal(Math.round(recolored[2]), 60);
});
