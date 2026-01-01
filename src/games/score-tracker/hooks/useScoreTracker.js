import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "scoreTracker_";

// Generate Whist round pattern based on player count:
// N x 1, 2-7, N x 8, 7-2, N x 1
function generateWhistRoundCards(playerCount) {
  const ones = Array(playerCount).fill(1);
  const ascending = [2, 3, 4, 5, 6, 7];
  const eights = Array(playerCount).fill(8);
  const descending = [7, 6, 5, 4, 3, 2];
  return [...ones, ...ascending, ...eights, ...descending, ...ones];
}

// Generate full Whist data structure with all rounds pre-populated
function generateWhistData(playerCount) {
  const cardPattern = generateWhistRoundCards(playerCount);
  return cardPattern.map((cards, index) => ({
    index,
    cards,
    phase: index === 0 ? 'bidding' : 'pending', // First round starts in bidding
    bids: Array(playerCount).fill(null),
    tricks: Array(playerCount).fill(null),
    scores: Array(playerCount).fill(null),
  }));
}

// Calculate Whist score for a player
function calcWhistScore(bid, tricks) {
  if (bid === tricks) {
    return 5 + tricks;
  }
  return -Math.abs(bid - tricks);
}

const GAME_CONFIG = {
  septica: {
    name: "Septica",
    minPlayers: 4,
    maxPlayers: 4,
    isTeamGame: true,
    teamCount: 2,
    maxRoundPoints: 8,
    shutoutPoints: 16, // When one team scores 0
  },
  whist: {
    name: "Whist",
    minPlayers: 3,
    maxPlayers: 6,
  },
  rentz: { name: "Rentz", minPlayers: 3, maxPlayers: 5 },
};

function loadFromStorage(gameType) {
  if (typeof window === "undefined" || !gameType) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + gameType);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveToStorage(gameType, data) {
  if (typeof window === "undefined" || !gameType) return;
  try {
    if (data === null) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + gameType);
    } else {
      localStorage.setItem(STORAGE_KEY_PREFIX + gameType, JSON.stringify(data));
    }
  } catch {
    // Ignore storage errors
  }
}

export function useScoreTracker(initialGameType = null) {
  const [gameType, setGameType] = useState(initialGameType);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]); // For team games like Septica: [["P1", "P3"], ["P2", "P4"]]
  const [rounds, setRounds] = useState([]); // For Septica/Rentz
  const [whistData, setWhistData] = useState([]); // For Whist: pre-populated rounds with phases
  const [phase, setPhase] = useState(initialGameType ? "setup" : "select");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const typeToLoad = initialGameType || gameType;
    if (!typeToLoad) {
      setIsLoaded(true);
      return;
    }

    const stored = loadFromStorage(typeToLoad);
    if (stored) {
      setPlayers(stored.players || []);
      setTeams(stored.teams || []);
      setRounds(stored.rounds || []);
      setWhistData(stored.whistData || []);
      if (stored.players?.length > 0 || stored.teams?.length > 0) {
        setPhase("playing");
      }
    }
    setIsLoaded(true);
  }, [initialGameType]);

  // Save to localStorage whenever game state changes
  useEffect(() => {
    if (!isLoaded) return;
    const typeToSave = initialGameType || gameType;
    if (!typeToSave) return;

    if (players.length > 0 || teams.length > 0) {
      saveToStorage(typeToSave, {
        players,
        teams,
        rounds,
        whistData,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [isLoaded, initialGameType, gameType, players, teams, rounds, whistData]);

  const selectGame = useCallback((type) => {
    setGameType(type);
    setPhase("setup");
  }, []);

  const startGame = useCallback((playerNames, gameTypeOverride = null) => {
    const type = gameTypeOverride || gameType;

    setPlayers(playerNames);
    setTeams([]);
    setRounds([]);

    // Generate whistData for Whist
    if (type === "whist") {
      setWhistData(generateWhistData(playerNames.length));
    } else {
      setWhistData([]);
    }

    setPhase("playing");
  }, [gameType]);

  const startTeamGame = useCallback((teamNames) => {
    // teamNames: [["Team1Name", "P1", "P2"], ["Team2Name", "P3", "P4"]]
    setTeams(teamNames);
    setPlayers([]);
    setRounds([]);
    setPhase("playing");
  }, []);

  const addRound = useCallback((scores, roundData = null) => {
    setRounds((prev) => [
      ...prev,
      { id: Date.now(), scores, ...(roundData && { data: roundData }) },
    ]);
  }, []);

  const updateRound = useCallback((roundId, scores, roundData = null) => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, scores, ...(roundData && { data: roundData }) } : r))
    );
  }, []);

  const deleteRound = useCallback((roundId) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
  }, []);

  // Whist: Update bids for a round and move to tricks phase
  const updateWhistBids = useCallback((roundIndex, bids) => {
    setWhistData((prev) => {
      const next = [...prev];
      next[roundIndex] = {
        ...next[roundIndex],
        bids,
        phase: 'tricks',
      };
      return next;
    });
  }, []);

  // Whist: Update tricks for a round, calculate scores, and move to complete
  const updateWhistTricks = useCallback((roundIndex, tricks, newBids = null) => {
    setWhistData((prev) => {
      const next = [...prev];
      const round = next[roundIndex];
      const bids = newBids || round.bids;
      const scores = bids.map((bid, i) => calcWhistScore(bid, tricks[i]));

      next[roundIndex] = {
        ...round,
        bids,
        tricks,
        scores,
        phase: 'complete',
      };

      // Activate next round if exists (only if not already complete)
      if (round.phase !== 'complete' && roundIndex + 1 < next.length) {
        next[roundIndex + 1] = {
          ...next[roundIndex + 1],
          phase: 'bidding',
        };
      }

      return next;
    });
  }, []);

  // Whist: Go back from tricks to bidding phase
  const revertWhistToBidding = useCallback((roundIndex) => {
    setWhistData((prev) => {
      const next = [...prev];
      next[roundIndex] = {
        ...next[roundIndex],
        tricks: Array(players.length).fill(null),
        scores: Array(players.length).fill(null),
        phase: 'bidding',
      };
      return next;
    });
  }, [players.length]);

  const newGame = useCallback(() => {
    const typeToRemove = initialGameType || gameType;
    setPlayers([]);
    setTeams([]);
    setRounds([]);
    setWhistData([]);
    setPhase("setup");
    if (typeToRemove) {
      saveToStorage(typeToRemove, null);
    }
  }, [initialGameType, gameType]);

  const goBack = useCallback(() => {
    if (phase === "setup") {
      setGameType(null);
      setPhase("select");
    } else if (phase === "playing" && rounds.length === 0) {
      setPlayers([]);
      setPhase("setup");
    }
  }, [phase, rounds.length]);

  const config = gameType ? GAME_CONFIG[gameType] : null;
  const isTeamGame = config?.isTeamGame || false;

  // Computed values - handle both team and individual games
  const totals = isTeamGame
    ? teams.map((_, teamIndex) =>
        rounds.reduce((sum, round) => sum + (round.scores[teamIndex] || 0), 0)
      )
    : players.map((_, playerIndex) =>
        rounds.reduce((sum, round) => sum + (round.scores[playerIndex] || 0), 0)
      );

  const leaderIndex = totals.length > 0
    ? totals.reduce((maxIdx, val, idx, arr) => (val > arr[maxIdx] ? idx : maxIdx), 0)
    : -1;

  // Whist-specific computed values
  const whistTotals = players.map((_, playerIndex) =>
    whistData.reduce((sum, round) => sum + (round.scores?.[playerIndex] || 0), 0)
  );
  const whistActiveRoundIndex = whistData.findIndex(r => r.phase === 'bidding' || r.phase === 'tricks');
  const whistIsComplete = whistData.length > 0 && whistData.every(r => r.phase === 'complete');

  return {
    // State
    gameType,
    players,
    teams,
    rounds,
    whistData,
    phase,
    isLoaded,
    config,

    // Computed
    totals,
    leaderIndex,
    isTeamGame,

    // Whist-specific computed
    whistTotals,
    whistActiveRoundIndex,
    whistIsComplete,

    // Actions
    selectGame,
    startGame,
    startTeamGame,
    addRound,
    updateRound,
    deleteRound,
    updateWhistBids,
    updateWhistTricks,
    revertWhistToBidding,
    newGame,
    goBack,

    // Constants
    GAME_CONFIG,
  };
}
