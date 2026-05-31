import { useRef, useState, useCallback } from "react";
import { useGameLoop } from "./useGameLoop";
import { hatchCreature } from "../../lib/commands";
import type { CreatureState } from "../../lib/types";
import "./HatchCeremony.css";

interface HatchCeremonyProps {
  state: CreatureState;
  onHatched: () => void;
  size?: "small" | "large";
}

const CLICKS_TO_HATCH = 5;

export function HatchCeremony({ state, onHatched, size = "large" }: HatchCeremonyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clicks, setClicks] = useState(0);
  const [hatching, setHatching] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const wobbleRef = useRef(0);

  const isSmall = size === "small";
  const canvasWidth = isSmall ? 160 : 400;
  const canvasHeight = isSmall ? 120 : 300;

  const crackStage = Math.min(Math.floor((clicks / CLICKS_TO_HATCH) * 3), 3);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, dt: number) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, "#1b4332");
      gradient.addColorStop(1, "#081c15");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Ground
      const groundY = Math.floor(canvasHeight * 0.75);
      ctx.fillStyle = "#2d6a4f";
      ctx.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);

      if (hatching) {
        // Hatch flash effect
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.max(0, 1 - wobbleRef.current * 2);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = 1;

        // Draw baby slug emerging
        if (wobbleRef.current > 0.3) {
          drawBabySlug(ctx, canvasWidth, canvasHeight, isSmall, wobbleRef.current);
        }

        wobbleRef.current += dt;
      } else {
        // Wobble animation
        wobbleRef.current += dt;
        const wobble = Math.sin(wobbleRef.current * 4) * (2 + clicks);

        drawEgg(ctx, canvasWidth, canvasHeight, isSmall, wobble, crackStage);
      }
    },
    [canvasWidth, canvasHeight, isSmall, hatching, crackStage, clicks]
  );

  useGameLoop(canvasRef, draw);

  const handleClick = async () => {
    if (hatching || naming) return;

    const next = clicks + 1;
    setClicks(next);

    if (next >= CLICKS_TO_HATCH) {
      setHatching(true);
      wobbleRef.current = 0;
      // Wait for animation then show naming
      setTimeout(() => {
        setHatching(false);
        setNaming(true);
      }, 1500);
    }
  };

  const handleHatch = async (creatureName?: string) => {
    try {
      await hatchCreature("slug", creatureName || undefined);
      onHatched();
    } catch (err) {
      console.error("Failed to hatch:", err);
    }
  };

  if (naming) {
    return (
      <div className={`hatch-ceremony hatch-ceremony-${size}`}>
        <div className="hatch-naming">
          <div className="hatch-naming-title">A slug has been born!</div>
          <div className="hatch-naming-subtitle">
            Generation {state.graveyard_count + 1}
          </div>
          <input
            className="hatch-naming-input"
            type="text"
            placeholder="Name your slug..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleHatch(name || undefined);
            }}
            autoFocus
            maxLength={24}
          />
          <div className="hatch-naming-actions">
            <button
              className="hatch-btn hatch-btn-primary"
              onClick={() => handleHatch(name || undefined)}
            >
              {name ? `Welcome, ${name}!` : "Hatch!"}
            </button>
            {name === "" && (
              <button
                className="hatch-btn hatch-btn-secondary"
                onClick={() => handleHatch()}
              >
                Skip naming
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hatch-ceremony hatch-ceremony-${size}`}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleClick}
        className="hatch-canvas"
      />
      <div className="hatch-hint">
        {clicks === 0
          ? "Click the egg to hatch it..."
          : clicks < CLICKS_TO_HATCH
            ? `${CLICKS_TO_HATCH - clicks} more...`
            : ""}
      </div>
    </div>
  );
}

function drawEgg(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  isSmall: boolean,
  wobble: number,
  crackStage: number
) {
  const px = isSmall ? 3 : 6;
  const groundY = Math.floor(canvasHeight * 0.75);
  const eggW = 10;
  const eggH = 12;
  const baseX = Math.floor(canvasWidth / 2) - Math.floor((eggW * px) / 2) + wobble;
  const baseY = groundY - (eggH * px);

  // Egg shape (rounded, 10x12 pixels)
  ctx.fillStyle = "#f5e6d3";
  // Top dome
  ctx.fillRect(baseX + 3*px, baseY, 4*px, px);
  ctx.fillRect(baseX + 2*px, baseY + px, 6*px, px);
  ctx.fillRect(baseX + px, baseY + 2*px, 8*px, px);
  // Upper body
  ctx.fillRect(baseX + px, baseY + 3*px, 8*px, 2*px);
  // Widest part
  ctx.fillRect(baseX, baseY + 5*px, 10*px, 3*px);
  // Lower body
  ctx.fillRect(baseX + px, baseY + 8*px, 8*px, 2*px);
  // Bottom
  ctx.fillRect(baseX + 2*px, baseY + 10*px, 6*px, px);
  ctx.fillRect(baseX + 3*px, baseY + 11*px, 4*px, px);

  // Green spots
  ctx.fillStyle = "#b8d4a3";
  ctx.fillRect(baseX + 3*px, baseY + 3*px, px, px);
  ctx.fillRect(baseX + 6*px, baseY + 5*px, px, px);
  ctx.fillRect(baseX + 2*px, baseY + 7*px, px, px);
  ctx.fillRect(baseX + 7*px, baseY + 8*px, px, px);
  ctx.fillRect(baseX + 4*px, baseY + 9*px, px, px);

  // Highlight
  ctx.fillStyle = "#faf3eb";
  ctx.fillRect(baseX + 3*px, baseY + 2*px, 2*px, px);
  ctx.fillRect(baseX + 2*px, baseY + 3*px, px, 2*px);

  // Cracks
  ctx.fillStyle = "#8b7355";
  if (crackStage >= 1) {
    ctx.fillRect(baseX + 5*px, baseY + 4*px, px, px);
    ctx.fillRect(baseX + 6*px, baseY + 5*px, px, px);
    ctx.fillRect(baseX + 5*px, baseY + 6*px, px, px);
  }
  if (crackStage >= 2) {
    ctx.fillRect(baseX + 3*px, baseY + 5*px, px, px);
    ctx.fillRect(baseX + 2*px, baseY + 6*px, px, px);
    ctx.fillRect(baseX + 4*px, baseY + 7*px, px, px);
    ctx.fillRect(baseX + 7*px, baseY + 6*px, px, px);
  }
  if (crackStage >= 3) {
    ctx.fillRect(baseX + 4*px, baseY + 4*px, px, px);
    ctx.fillRect(baseX + px, baseY + 6*px, px, px);
    ctx.fillRect(baseX + 8*px, baseY + 7*px, px, px);
    ctx.fillRect(baseX + 5*px, baseY + 8*px, px, px);
    ctx.fillRect(baseX + 3*px, baseY + 9*px, px, px);
  }
}

function drawBabySlug(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  isSmall: boolean,
  progress: number
) {
  const px = isSmall ? 3 : 6;
  const groundY = Math.floor(canvasHeight * 0.75);
  const bodyW = 14;
  const bodyH = 10;
  const baseX = Math.floor(canvasWidth / 2) - Math.floor((bodyW * px) / 2);
  const baseY = groundY - (bodyH * px);

  // Fade in
  ctx.globalAlpha = Math.min(1, (progress - 0.3) * 2);

  // Slug body
  ctx.fillStyle = "#4a9c5e";
  ctx.fillRect(baseX + 2*px, baseY + 9*px, 10*px, px);
  ctx.fillRect(baseX + px, baseY + 8*px, 12*px, px);
  ctx.fillRect(baseX, baseY + 5*px, 13*px, 3*px);
  ctx.fillRect(baseX + px, baseY + 3*px, 11*px, 2*px);
  ctx.fillRect(baseX + 2*px, baseY + 2*px, 9*px, px);
  ctx.fillRect(baseX + 3*px, baseY + px, 7*px, px);

  // Belly
  ctx.fillStyle = "#6abc7e";
  ctx.fillRect(baseX + 3*px, baseY + 7*px, 8*px, px);
  ctx.fillRect(baseX + 2*px, baseY + 6*px, 9*px, px);

  // Eye stalks
  ctx.fillStyle = "#4a9c5e";
  ctx.fillRect(baseX + 8*px, baseY, px, 2*px);
  ctx.fillRect(baseX + 10*px, baseY, px, 2*px);

  // Eyes
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(baseX + 8*px, baseY + 2*px, px, px);
  ctx.fillRect(baseX + 10*px, baseY + 2*px, px, px);

  // Happy mouth
  ctx.fillStyle = "#2a5a3e";
  ctx.fillRect(baseX + 8*px, baseY + 4*px, 2*px, px);

  // Sparkle particles
  if (progress > 0.5) {
    ctx.fillStyle = "#ffd700";
    const sparkleCount = 6;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2 + progress * 3;
      const dist = (12 + Math.sin(progress * 5 + i) * 6) * px;
      const sx = Math.floor(canvasWidth / 2 + Math.cos(angle) * dist);
      const sy = Math.floor(baseY + 4 * px + Math.sin(angle) * dist * 0.6);
      // Cross-shaped sparkle
      ctx.fillRect(sx, sy, px, px);
      ctx.fillRect(sx - px, sy, px, px);
      ctx.fillRect(sx + px, sy, px, px);
      ctx.fillRect(sx, sy - px, px, px);
      ctx.fillRect(sx, sy + px, px, px);
    }
  }

  ctx.globalAlpha = 1;
}
