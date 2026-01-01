"use client";

import dynamic from "next/dynamic";

const ScoreTrackerGame = dynamic(
  () =>
    import("@/games/score-tracker/ScoreTrackerGame").then(
      (mod) => mod.ScoreTrackerGame
    ),
  { ssr: false }
);

export default function ScoreTrackerPage() {
  return <ScoreTrackerGame />;
}
