import { useState, useCallback, useEffect } from "react";
import { supabaseGames } from "@/lib/supabase/client";
import { generateRoomCode } from "@/lib/random";
import { CHROMA_SCORING_VERSION } from "../utils/color";
import { isDailyChallengeCode } from "../utils/daily";

const TABLE = "chroma_challenges";

/**
 * Generate a challenge code (used as seed).
 */
export function generateChallengeCode() {
  return generateRoomCode() + Math.floor(Math.random() * 9000 + 1000);
}

/**
 * Save and fetch challenge scores. Daily codes return the global top three.
 */
export default function useChromaChallenge(challengeCode) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState(null);
  const leaderboardLimit = isDailyChallengeCode(challengeCode) ? 3 : 100;

  // Fetch leaderboard for this challenge
  const fetchLeaderboard = useCallback(async () => {
    if (!challengeCode) return;
    setLoading(true);
    setHasFetched(false);
    setError(null);
    const { data, error: fetchError } = await supabaseGames
      .from(TABLE)
      .select("player_id, player_name, scores, total_score, updated_at")
      .eq("challenge_code", challengeCode)
      .eq("scoring_version", CHROMA_SCORING_VERSION)
      .order("total_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(leaderboardLimit);

    if (fetchError) {
      console.error("Chroma: failed to load leaderboard", fetchError);
      setError(fetchError.message);
      setLeaderboard([]);
    } else {
      setLeaderboard(data || []);
    }
    setLoading(false);
    setHasFetched(true);
  }, [challengeCode, leaderboardLimit]);

  // Fetch on mount and when code changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Save score (upsert — update if player already played this challenge)
  // Returns true on success, false on failure
  const saveScore = useCallback(
    async (userId, userName, rounds, difficulty) => {
      if (!challengeCode || !userId) return false;
      setError(null);

      const scores = rounds.map((round) => round.score);
      const guesses = rounds.map((round) => round.guess);
      if (scores.length !== 3 || guesses.length !== 3) return false;

      const { error: saveError } = await supabaseGames.rpc("submit_chroma_score", {
        p_challenge_code: challengeCode,
        p_player_id: userId,
        p_player_name: userName,
        p_scores: scores,
        p_guesses: guesses,
        p_difficulty: difficulty,
        p_scoring_version: CHROMA_SCORING_VERSION,
      });

      if (saveError) {
        console.error("Chroma: failed to save score", saveError);
        setError(saveError.message);
        return false;
      }

      await fetchLeaderboard();
      return true;
    },
    [challengeCode, fetchLeaderboard]
  );

  return {
    leaderboard,
    loading,
    hasFetched,
    error,
    saveScore,
    fetchLeaderboard,
  };
}
