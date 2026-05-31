import { useState, useEffect, useRef, useCallback } from "react";
import { getGraveyard } from "../../lib/commands";
import { useGameLoop } from "./useGameLoop";
import type { Creature } from "../../lib/types";
import "./Graveyard.css";

export function Graveyard() {
  const [creatures, setCreatures] = useState<Creature[]>([]);

  useEffect(() => {
    getGraveyard().then(setCreatures).catch(() => {});
  }, []);

  if (creatures.length === 0) {
    return (
      <div className="graveyard-empty">
        <div className="graveyard-empty-text">
          The graveyard is empty. Keep it that way.
        </div>
      </div>
    );
  }

  return (
    <div className="graveyard">
      <div className="graveyard-title">The Graveyard</div>
      <div className="graveyard-subtitle">
        {creatures.length} slug{creatures.length !== 1 ? "s" : ""} lost to neglect
      </div>
      <div className="graveyard-grid">
        {creatures.map((c) => (
          <Tombstone key={c.id} creature={c} />
        ))}
      </div>
    </div>
  );
}

function Tombstone({ creature }: { creature: Creature }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, _dt: number) => {
      const w = 80;
      const h = 80;
      ctx.clearRect(0, 0, w, h);

      const px = 2;

      // Ground
      ctx.fillStyle = "#2d2d2d";
      ctx.fillRect(0, h - 8, w, 8);

      // Tombstone body
      ctx.fillStyle = "#555";
      ctx.fillRect(24, 20, 32, 52);
      // Rounded top
      ctx.fillRect(28, 16, 24, 4);
      ctx.fillRect(32, 14, 16, 2);

      // RIP text
      ctx.fillStyle = "#999";
      ctx.fillRect(34, 26, 2, 2); // R
      ctx.fillRect(38, 26, 2, 2); // I
      ctx.fillRect(42, 26, 2, 2); // P

      // Ghost slug floating above
      const float = Math.sin(Date.now() / 600) * 2;
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 400) * 0.1;
      ctx.fillStyle = "#8888aa";
      // Tiny slug shape
      ctx.fillRect(32, 36 + float, 16, px);
      ctx.fillRect(30, 38 + float, 20, px);
      ctx.fillRect(30, 40 + float, 18, px);
      ctx.fillRect(32, 42 + float, 14, px);
      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(42, 40 + float, px, px);
      ctx.globalAlpha = 1;
    },
    []
  );

  useGameLoop(canvasRef, draw);

  const bornDate = new Date(creature.born_at).toLocaleDateString();
  const diedDate = creature.died_at
    ? new Date(creature.died_at).toLocaleDateString()
    : "???";

  return (
    <div className="tombstone">
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        className="tombstone-canvas"
      />
      <div className="tombstone-info">
        <div className="tombstone-name">
          {creature.name ?? `Slug #${creature.generation}`}
        </div>
        <div className="tombstone-dates">
          {bornDate} — {diedDate}
        </div>
        <div className="tombstone-gen">Generation {creature.generation}</div>
        {creature.cause_of_death && (
          <div className="tombstone-cause">
            Cause: {creature.cause_of_death}
          </div>
        )}
      </div>
    </div>
  );
}
