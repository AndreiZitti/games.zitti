import { useState, useCallback, useEffect } from "react";
import { supabaseGames } from "@/lib/supabase/client";
import { generateRoomCode, createSeededRandom } from "@/lib/random";

const TABLE = "chroma_challenges";

/**
 * Generate 3 deterministic HSB colors from a seed string.
 */
export function seededGameColors(seed) {
  const rng = createSeededRandom(seed);
  return Array.from({ length: 3 }, () => [
    Math.floor(rng() * 360),
    15 + Math.floor(rng() * 86),
    15 + Math.floor(rng() * 86),
  ]);
}

/**
 * Generate a challenge code (used as seed).
 */
export function generateChallengeCode() {
  return generateRoomCode() + Math.floor(Math.random() * 9000 + 1000);
}

/**
 * Hook for challenge mode: save/fetch scores for authenticated users.
 */
export default function useChromaChallenge(challengeCode) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch leaderboard for this challenge
  const fetchLeaderboard = useCallback(async () => {
    if (!challengeCode) return;
    setLoading(true);
    const { data } = await supabaseGames
      .from(TABLE)
      .select("*")
      .eq("challenge_code", challengeCode)
      .order("total_score", { ascending: false });

    setLeaderboard(data || []);
    setLoading(false);
  }, [challengeCode]);

  // Fetch on mount and when code changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Save score (upsert — update if player already played this challenge)
  const saveScore = useCallback(
    async (userId, userName, scores, totalScore, difficulty) => {
      if (!challengeCode || !userId) return;

      await supabaseGames.from(TABLE).upsert(
        {
          challenge_code: challengeCode,
          player_id: userId,
          player_name: userName,
          scores,
          total_score: totalScore,
          difficulty,
        },
        { onConflict: "challenge_code,player_id" }
      );

      // Refresh leaderboard
      await fetchLeaderboard();
    },
    [challengeCode, fetchLeaderboard]
  );

  return {
    leaderboard,
    loading,
    saveScore,
    fetchLeaderboard,
  };
}
