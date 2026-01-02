"use client";

import { useState } from "react";
import "@/games/quirtle/quirtle.css";
import { SHAPES, COLORS } from "@/games/quirtle/utils/tiles";
import { Tile } from "@/games/quirtle/components/Tile";

export default function QuirtleTestPage() {
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  return (
    <div className="quirtle-game" style={{ minHeight: "100vh", padding: "2rem", background: "var(--quirtle-bg)" }}>
      <h1 style={{ color: "var(--quirtle-accent)", marginBottom: "0.5rem" }}>Quirtle Design Test</h1>
      <p style={{ color: "var(--quirtle-text-muted)", marginBottom: "2rem" }}>
        Click tiles to select. Use this page to test designs and animations.
      </p>

      {/* All tiles grid */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "var(--quirtle-text)", marginBottom: "1rem" }}>All Tiles (6 shapes × 6 colors)</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {SHAPES.map((shape) => (
            <div key={shape} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "var(--quirtle-text-muted)", width: "80px", fontSize: "0.75rem" }}>
                {shape}
              </span>
              {COLORS.map((color) => {
                const id = `${shape}-${color}`;
                return (
                  <Tile
                    key={id}
                    tile={{ shape, color }}
                    selected={selectedTile === id}
                    onClick={() => setSelectedTile(selectedTile === id ? null : id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", color: "var(--quirtle-text-muted)", fontSize: "0.875rem" }}>
          Colors: {COLORS.join(", ")}
        </div>
      </section>

      {/* Tile states */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "var(--quirtle-text)", marginBottom: "1rem" }}>Tile States</h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "yellow" }} />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>Normal</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "yellow" }} selected />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>Selected</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "yellow" }} disabled />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>Disabled</p>
          </div>
        </div>
      </section>

      {/* Sample hand */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "var(--quirtle-text)", marginBottom: "1rem" }}>Sample Hand</h2>
        <div className="quirtle-hand">
          <Tile tile={{ shape: "circle", color: "red" }} />
          <Tile tile={{ shape: "square", color: "blue" }} />
          <Tile tile={{ shape: "diamond", color: "green" }} selected />
          <Tile tile={{ shape: "star", color: "yellow" }} />
          <Tile tile={{ shape: "cross", color: "purple" }} />
          <Tile tile={{ shape: "triangle", color: "orange" }} />
        </div>
      </section>

      {/* Sample board layout */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "var(--quirtle-text)", marginBottom: "1rem" }}>Sample Board Layout</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 54px)",
          gap: "2px",
          background: "#0f172a",
          padding: "1rem",
          borderRadius: "1rem",
          width: "fit-content"
        }}>
          {/* Row 1 */}
          <div />
          <div />
          <Tile tile={{ shape: "circle", color: "red" }} />
          <div />
          <div />

          {/* Row 2 */}
          <div />
          <div />
          <Tile tile={{ shape: "circle", color: "blue" }} />
          <div />
          <div />

          {/* Row 3 - horizontal line */}
          <Tile tile={{ shape: "star", color: "green" }} />
          <Tile tile={{ shape: "diamond", color: "green" }} />
          <Tile tile={{ shape: "circle", color: "green" }} />
          <Tile tile={{ shape: "square", color: "green" }} />
          <Tile tile={{ shape: "triangle", color: "green" }} />

          {/* Row 4 */}
          <div />
          <div />
          <Tile tile={{ shape: "circle", color: "yellow" }} />
          <div />
          <div />

          {/* Row 5 */}
          <div />
          <div />
          <Tile tile={{ shape: "circle", color: "purple" }} />
          <div />
          <div />
        </div>
        <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          Horizontal: same color (green) | Vertical: same shape (circle)
        </p>
      </section>

      {/* Tile sizes */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "var(--quirtle-text)", marginBottom: "1rem" }}>Tile Sizes</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "blue" }} size={40} />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>40px</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "blue" }} size={50} />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>50px (default)</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "blue" }} size={60} />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>60px</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Tile tile={{ shape: "star", color: "blue" }} size={80} />
            <p style={{ color: "var(--quirtle-text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>80px</p>
          </div>
        </div>
      </section>

      <a
        href="/games/quirtle"
        style={{
          color: "var(--quirtle-accent)",
          textDecoration: "underline",
          display: "inline-block",
          marginTop: "1rem"
        }}
      >
        &larr; Back to Quirtle
      </a>
    </div>
  );
}
