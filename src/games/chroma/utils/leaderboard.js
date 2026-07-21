export const DAILY_LEADERBOARD_SIZE = 3;

/**
 * A guest qualifies only when their score is strictly above the current
 * third-place score. An incomplete leaderboard has open qualifying places.
 */
export function qualifiesForDailyTopThree(totalScore, leaderboard) {
  if (!Number.isFinite(totalScore)) return false;

  // Stored Chroma totals are rounded to one decimal place. Comparing at the
  // same precision keeps floating-point noise from turning a tie into a win.
  const candidateScore = Math.round(totalScore * 10) / 10;

  const rankedScores = leaderboard
    .map((entry) => Number(entry.total_score))
    .filter(Number.isFinite)
    .map((score) => Math.round(score * 10) / 10)
    .sort((a, b) => b - a)
    .slice(0, DAILY_LEADERBOARD_SIZE);

  if (rankedScores.length < DAILY_LEADERBOARD_SIZE) return true;
  return candidateScore > rankedScores[DAILY_LEADERBOARD_SIZE - 1];
}
