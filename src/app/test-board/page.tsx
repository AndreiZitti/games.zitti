"use client";

import React, { useState } from "react";
import Board from "@/games/secret-hitler/board/Board";
import { getThemeAssets, getThemeLayout, ThemeId } from "@/games/secret-hitler/assets/themes";

// Import styles
import "@/games/secret-hitler/styles/base.css";
import "@/games/secret-hitler/styles/theme-original.css";
import "@/games/secret-hitler/styles/theme-voldemort.css";
import "@/games/secret-hitler/board/Board.css";

export default function TestBoardPage() {
  const [theme, setTheme] = useState<ThemeId>("voldemort");
  const [liberalPolicies, setLiberalPolicies] = useState(2);
  const [fascistPolicies, setFascistPolicies] = useState(3);
  const [electionTracker, setElectionTracker] = useState(1);
  const [numPlayers, setNumPlayers] = useState(6);

  const themeAssets = getThemeAssets(theme);
  const themeLayout = getThemeLayout(theme);

  return (
    <div className={`secret-hitler-game-container theme-${theme}`} style={{
      minHeight: "100vh",
      padding: "20px",
      backgroundColor: theme === "voldemort" ? "#1a1a2e" : "#2a2a2a"
    }}>
      <h1 style={{ color: "white", marginBottom: "20px" }}>Board Alignment Test</h1>

      <div style={{ marginBottom: "20px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <label style={{ color: "white" }}>
          Theme:
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeId)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="original">Original</option>
            <option value="voldemort">Voldemort</option>
          </select>
        </label>

        <label style={{ color: "white" }}>
          Liberal Policies (0-5):
          <input
            type="range"
            min="0"
            max="5"
            value={liberalPolicies}
            onChange={(e) => setLiberalPolicies(Number(e.target.value))}
            style={{ marginLeft: "10px" }}
          />
          <span style={{ marginLeft: "5px" }}>{liberalPolicies}</span>
        </label>

        <label style={{ color: "white" }}>
          Fascist Policies (0-6):
          <input
            type="range"
            min="0"
            max="6"
            value={fascistPolicies}
            onChange={(e) => setFascistPolicies(Number(e.target.value))}
            style={{ marginLeft: "10px" }}
          />
          <span style={{ marginLeft: "5px" }}>{fascistPolicies}</span>
        </label>

        <label style={{ color: "white" }}>
          Election Tracker (0-3):
          <input
            type="range"
            min="0"
            max="3"
            value={electionTracker}
            onChange={(e) => setElectionTracker(Number(e.target.value))}
            style={{ marginLeft: "10px" }}
          />
          <span style={{ marginLeft: "5px" }}>{electionTracker}</span>
        </label>

        <label style={{ color: "white" }}>
          Players:
          <select
            value={numPlayers}
            onChange={(e) => setNumPlayers(Number(e.target.value))}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="5">5-6 players</option>
            <option value="7">7-8 players</option>
            <option value="9">9-10 players</option>
          </select>
        </label>
      </div>

      <div style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "800px"
      }}>
        <Board
          numPlayers={numPlayers}
          numLiberalPolicies={liberalPolicies}
          numFascistPolicies={fascistPolicies}
          electionTracker={electionTracker}
          themeAssets={themeAssets}
          themeLayout={themeLayout}
        />
      </div>

      <div style={{ marginTop: "20px", color: "white", fontSize: "14px" }}>
        <h3>Current Layout Values:</h3>
        <pre style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "5px" }}>
{JSON.stringify(themeLayout, null, 2)}
        </pre>
      </div>
    </div>
  );
}
