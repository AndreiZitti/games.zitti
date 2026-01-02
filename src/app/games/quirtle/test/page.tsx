"use client";

import { useState, useCallback } from "react";
import "@/games/quirtle/quirtle.css";
import { SHAPES, COLORS, generateAllTiles, shuffleArray, drawTiles, HAND_SIZE } from "@/games/quirtle/utils/tiles";
import { getValidPositions, calculateScore, isValidPlacement } from "@/games/quirtle/utils/validation";
import { Tile } from "@/games/quirtle/components/Tile";
import { GameBoard } from "@/games/quirtle/components/GameBoard";
import { PlayerHand } from "@/games/quirtle/components/PlayerHand";

export default function QuirtleTestPage() {
  // Game state
  const [board, setBoard] = useState({ tiles: [] });
  const [hand, setHand] = useState(() => {
    const allTiles = shuffleArray(generateAllTiles());
    return allTiles.slice(0, HAND_SIZE);
  });
  const [bag, setBag] = useState(() => {
    const allTiles = shuffleArray(generateAllTiles());
    return allTiles.slice(HAND_SIZE);
  });
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  const [pendingPlacements, setPendingPlacements] = useState([]);
  const [usedHandIndices, setUsedHandIndices] = useState([]);
  const [lastScore, setLastScore] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [turnCount, setTurnCount] = useState(1);
  const [message, setMessage] = useState("Select a tile from your hand, then click a valid position to place it");

  // Rearrange mode
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [swapFirstIndex, setSwapFirstIndex] = useState<number | null>(null);

  // Reset game
  const resetGame = useCallback(() => {
    const allTiles = shuffleArray(generateAllTiles());
    setBoard({ tiles: [] });
    setHand(allTiles.slice(0, HAND_SIZE));
    setBag(allTiles.slice(HAND_SIZE));
    setSelectedTileIndex(null);
    setPendingPlacements([]);
    setUsedHandIndices([]);
    setLastScore(null);
    setTotalScore(0);
    setTurnCount(1);
    setRearrangeMode(false);
    setSwapFirstIndex(null);
    setMessage("Select a tile from your hand, then click a valid position to place it");
  }, []);

  // Sort hand by color
  const sortByColor = () => {
    const colorOrder = COLORS.reduce((acc, c, i) => ({ ...acc, [c]: i }), {} as Record<string, number>);
    const sorted = [...hand].sort((a, b) => {
      const colorDiff = colorOrder[a.color] - colorOrder[b.color];
      if (colorDiff !== 0) return colorDiff;
      return SHAPES.indexOf(a.shape) - SHAPES.indexOf(b.shape);
    });
    setHand(sorted);
    setMessage("Hand sorted by color");
  };

  // Sort hand by shape
  const sortByShape = () => {
    const shapeOrder = SHAPES.reduce((acc, s, i) => ({ ...acc, [s]: i }), {} as Record<string, number>);
    const sorted = [...hand].sort((a, b) => {
      const shapeDiff = shapeOrder[a.shape] - shapeOrder[b.shape];
      if (shapeDiff !== 0) return shapeDiff;
      return COLORS.indexOf(a.color) - COLORS.indexOf(b.color);
    });
    setHand(sorted);
    setMessage("Hand sorted by shape");
  };

  // Handle tile swap in rearrange mode
  const handleRearrangeTap = (index: number) => {
    if (swapFirstIndex === null) {
      setSwapFirstIndex(index);
      setMessage(`Tap another tile to swap with ${hand[index].color} ${hand[index].shape}`);
    } else if (swapFirstIndex === index) {
      setSwapFirstIndex(null);
      setMessage("Swap cancelled");
    } else {
      // Swap the tiles
      const newHand = [...hand];
      [newHand[swapFirstIndex], newHand[index]] = [newHand[index], newHand[swapFirstIndex]];
      setHand(newHand);
      setSwapFirstIndex(null);
      setMessage("Tiles swapped!");
    }
  };

  // Exit rearrange mode
  const exitRearrangeMode = () => {
    setRearrangeMode(false);
    setSwapFirstIndex(null);
    setMessage("Select a tile from your hand, then click a valid position to place it");
  };

  // Handle tile selection from hand
  const handleSelectTile = (index) => {
    if (usedHandIndices.includes(index)) return;
    setSelectedTileIndex(selectedTileIndex === index ? null : index);
  };

  // Handle placing tile on board
  const handlePlaceTile = (position) => {
    if (selectedTileIndex === null) return;

    const tile = hand[selectedTileIndex];

    // Validate against virtual board (with pending placements)
    const virtualBoard = {
      tiles: [...board.tiles, ...pendingPlacements.map(p => ({ ...p.tile, x: p.x, y: p.y }))]
    };

    if (!isValidPlacement(virtualBoard, tile, position.x, position.y)) {
      setMessage("Invalid placement!");
      return;
    }

    setPendingPlacements(prev => [...prev, { tile, x: position.x, y: position.y, handIndex: selectedTileIndex }]);
    setUsedHandIndices(prev => [...prev, selectedTileIndex]);
    setSelectedTileIndex(null);
    setMessage(`Placed ${tile.color} ${tile.shape}. Place more or confirm turn.`);
  };

  // Confirm turn
  const confirmTurn = () => {
    if (pendingPlacements.length === 0) return;

    // Calculate score
    const placedTiles = pendingPlacements.map(p => ({ ...p.tile, x: p.x, y: p.y }));
    const { totalScore: turnScore, scoredLines } = calculateScore(board, placedTiles);

    // Update board
    const newBoard = {
      tiles: [...board.tiles, ...placedTiles]
    };
    setBoard(newBoard);

    // Remove used tiles from hand and draw new ones
    let newHand = hand.filter((_, i) => !usedHandIndices.includes(i));
    const tilesToDraw = Math.min(HAND_SIZE - newHand.length, bag.length);
    const { drawn, remaining } = drawTiles(bag, tilesToDraw);
    newHand = [...newHand, ...drawn];
    setHand(newHand);
    setBag(remaining);

    // Update score
    setTotalScore(prev => prev + turnScore);
    setLastScore({ points: turnScore, lines: scoredLines });

    // Reset turn state
    setPendingPlacements([]);
    setUsedHandIndices([]);
    setSelectedTileIndex(null);
    setTurnCount(prev => prev + 1);

    const qwirkle = scoredLines.some(l => l.isQwirkle);
    setMessage(`Turn ${turnCount}: Scored ${turnScore} points!${qwirkle ? ' QWIRKLE!' : ''} Drew ${tilesToDraw} tiles.`);
  };

  // Cancel pending placements
  const cancelPlacements = () => {
    setPendingPlacements([]);
    setUsedHandIndices([]);
    setSelectedTileIndex(null);
    setMessage("Placements cancelled. Select a tile to try again.");
  };

  // Get selected tile for board highlighting
  const selectedTile = selectedTileIndex !== null ? hand[selectedTileIndex] : null;

  // Virtual board with pending placements
  const virtualBoard = {
    tiles: [...board.tiles, ...pendingPlacements.map(p => ({ ...p.tile, x: p.x, y: p.y }))]
  };

  // Valid positions for selected tile
  const validPositions = selectedTile ? getValidPositions(virtualBoard, selectedTile) : [];

  return (
    <div className="quirtle-game" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--quirtle-bg)" }}>
      {/* Header */}
      <div style={{
        padding: "1rem",
        background: "var(--quirtle-surface)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 style={{ color: "var(--quirtle-accent)", margin: 0, fontSize: "1.5rem" }}>Gameplay Test</h1>
          <p style={{ color: "var(--quirtle-text-muted)", margin: 0, fontSize: "0.875rem" }}>
            Turn {turnCount} | Score: {totalScore} | Bag: {bag.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={resetGame}>
            Reset Game
          </button>
          <a href="/games/quirtle" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Back
          </a>
        </div>
      </div>

      {/* Message bar */}
      <div style={{
        padding: "0.75rem",
        background: lastScore?.lines?.some(l => l.isQwirkle) ? "#f59e0b" : "var(--quirtle-accent)",
        color: "white",
        textAlign: "center",
        fontWeight: 500
      }}>
        {message}
      </div>

      {/* Last score breakdown */}
      {lastScore && (
        <div style={{
          padding: "0.5rem",
          background: "#334155",
          color: "var(--quirtle-text)",
          textAlign: "center",
          fontSize: "0.875rem"
        }}>
          Lines scored: {lastScore.lines.map((l, i) => (
            <span key={i} style={{ marginLeft: "0.5rem" }}>
              {l.length} tiles = {l.points}pts{l.isQwirkle ? " (QWIRKLE!)" : ""}
            </span>
          ))}
        </div>
      )}

      {/* Game board */}
      <div style={{ flex: 1, position: "relative" }}>
        <GameBoard
          board={virtualBoard}
          selectedTile={selectedTile}
          onPlaceTile={handlePlaceTile}
        />
      </div>

      {/* Footer with hand */}
      <div style={{ padding: "1rem", background: "var(--quirtle-surface)" }}>
        {/* Rearrange mode controls */}
        {rearrangeMode ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button className="btn btn-secondary" onClick={sortByColor} style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                Sort by Color
              </button>
              <button className="btn btn-secondary" onClick={sortByShape} style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                Sort by Shape
              </button>
            </div>
            <p style={{ textAlign: "center", color: "var(--quirtle-text-muted)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Tap two tiles to swap them, or use sort buttons above
            </p>
            <div className="quirtle-hand">
              {hand.map((tile, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <Tile
                    tile={tile}
                    selected={swapFirstIndex === index}
                    onClick={() => handleRearrangeTap(index)}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn btn-primary" onClick={exitRearrangeMode}>
                Done Rearranging
              </button>
            </div>
          </>
        ) : (
          <>
            {pendingPlacements.length > 0 && (
              <p style={{ textAlign: "center", color: "var(--quirtle-text-muted)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                Pending: {pendingPlacements.length} tile(s) - place more in the same line or confirm
              </p>
            )}

            <div className="quirtle-hand">
              {hand.map((tile, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <Tile
                    tile={tile}
                    selected={selectedTileIndex === index}
                    disabled={usedHandIndices.includes(index)}
                    onClick={() => handleSelectTile(index)}
                  />
                  {usedHandIndices.includes(index) && (
                    <div className="quirtle-tile-used-overlay">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              {pendingPlacements.length > 0 ? (
                <>
                  <button className="btn btn-primary" onClick={confirmTurn}>
                    Confirm Turn ({pendingPlacements.length} tile{pendingPlacements.length > 1 ? "s" : ""})
                  </button>
                  <button className="btn btn-secondary" onClick={cancelPlacements}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setRearrangeMode(true); setMessage("Rearrange mode: tap tiles to swap or use sort buttons"); }}
                    style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                  >
                    Rearrange Hand
                  </button>
                </>
              )}
            </div>

            {!pendingPlacements.length && !rearrangeMode && (
              <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.875rem", textAlign: "center", marginTop: "0.5rem" }}>
                {validPositions.length > 0
                  ? `${validPositions.length} valid position(s) for selected tile`
                  : selectedTile
                    ? "No valid positions for this tile"
                    : "Select a tile from your hand"
                }
              </p>
            )}
          </>
        )}
      </div>

      {/* Debug info */}
      <details style={{ padding: "1rem", background: "#0f172a", color: "var(--quirtle-text-muted)", fontSize: "0.75rem" }}>
        <summary style={{ cursor: "pointer" }}>Debug Info</summary>
        <pre style={{ marginTop: "0.5rem", overflow: "auto" }}>
          {JSON.stringify({
            boardTiles: board.tiles.length,
            handSize: hand.length,
            bagSize: bag.length,
            pendingPlacements: pendingPlacements.length,
            selectedTileIndex,
            validPositionsCount: validPositions.length
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
