/**
 * Sprite sheet loader and frame extraction.
 * Sprite sheets are horizontal strips: each frame is frameWidth x frameHeight.
 */

export interface SpriteAnimation {
  sheet: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  speed: number; // frames per second
}

export interface SpriteSheet {
  image: HTMLImageElement;
  loaded: boolean;
}

const cache = new Map<string, SpriteSheet>();

export function loadSpriteSheet(src: string): Promise<SpriteSheet> {
  const cached = cache.get(src);
  if (cached?.loaded) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sheet: SpriteSheet = { image: img, loaded: true };
      cache.set(src, sheet);
      resolve(sheet);
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  anim: SpriteAnimation,
  frame: number,
  x: number,
  y: number,
  scale: number = 1
) {
  const sx = (frame % anim.frameCount) * anim.frameWidth;
  const sy = 0;
  ctx.drawImage(
    anim.sheet,
    sx,
    sy,
    anim.frameWidth,
    anim.frameHeight,
    x,
    y,
    anim.frameWidth * scale,
    anim.frameHeight * scale
  );
}
