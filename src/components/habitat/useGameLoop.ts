import { useEffect, useRef } from "react";

type DrawFn = (ctx: CanvasRenderingContext2D, dt: number) => void;

/**
 * requestAnimationFrame game loop hook.
 * Targets ~10 FPS for authentic pixel art feel.
 * Pauses when tab is hidden (battery friendly).
 */
export function useGameLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: DrawFn
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let lastTime = 0;
    const frameInterval = 1000 / 10; // ~10 FPS
    let accumulator = 0;

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);

      if (document.hidden) return;

      const delta = lastTime === 0 ? 0 : time - lastTime;
      lastTime = time;
      accumulator += delta;

      if (accumulator >= frameInterval) {
        ctx.imageSmoothingEnabled = false;
        drawRef.current(ctx, accumulator / 1000);
        accumulator = 0;
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [canvasRef]);
}
