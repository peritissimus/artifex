import { hexToRgb, type Rgb } from '../util/hex-to-rgb';
import { roundRect } from '../util/round-rect';
import type { Layout } from './layout';

/** Darkens horizontal stripes inside the body region of the window. */
export function drawScanlines(ctx: CanvasRenderingContext2D, l: Layout, intensity: number) {
  if (intensity <= 0) return;
  const { winX, winY, winW, winH, winR, titleBarH, scale: s } = l;

  ctx.save();
  // Intersect rounded window shape with body sub-rect — gives rounded bottom
  // corners and a flat top edge below the title bar.
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(winX, winY + titleBarH, winW, winH - titleBarH);
  ctx.clip();

  ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.55})`;
  const period = 2 * s;
  const lineH = 1 * s;
  for (let y = winY + titleBarH; y < winY + winH; y += period) {
    ctx.fillRect(winX, y, winW, lineH);
  }
  ctx.restore();
}

const GREY: Rgb = { r: 160, g: 160, b: 160 };

/**
 * Three additive layers that read like the screen is the light source:
 *   1. Distant grey ambient — wide, faint, room-fill atmosphere.
 *   2. Rim glow — the window body shape with large shadowBlur, two passes.
 *      The shadow naturally extends the rectangle outward, so the halo
 *      hugs the window proportions rather than reading as a point glow.
 *   3. Phosphor highlight — small tight radial at the prompt cursor.
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  intensity: number,
  accentHex: string
) {
  if (intensity <= 0) return;
  const {
    W,
    H,
    winX,
    winY,
    winW,
    winH,
    winR,
    titleBarH,
    terminalX,
    bodyPadX,
    promptY,
    tFontPx,
    scale: s,
  } = l;

  const accent = hexToRgb(accentHex);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 1. Distant ambient haze — broad, very faint, soft falloff.
  const ambientCx = W * 0.5;
  const ambientCy = winY + winH * 0.55;
  const ambientR = Math.max(W, H) * 0.95;
  const ambient = ctx.createRadialGradient(ambientCx, ambientCy, 0, ambientCx, ambientCy, ambientR);
  const aPeak = intensity * 0.045;
  ambient.addColorStop(0.0, rgba(GREY, aPeak));
  ambient.addColorStop(0.4, rgba(GREY, aPeak * 0.5));
  ambient.addColorStop(0.75, rgba(GREY, aPeak * 0.15));
  ambient.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, W, H);

  // 2. Rim glow — three passes from tight to atmospheric. The smallest pass
  // hugs the window outline; the largest washes a soft accent into the room.
  const bodyX = winX;
  const bodyY = winY + titleBarH;
  const bodyW = winW;
  const bodyH = winH - titleBarH;
  const rimPasses = [
    { blur: 70 * s, alpha: intensity * 0.22 }, // hugs the edge
    { blur: 200 * s, alpha: intensity * 0.14 }, // mid spread
    { blur: 460 * s, alpha: intensity * 0.07 }, // far wash bleeding into bg
  ];
  for (const pass of rimPasses) {
    ctx.shadowColor = rgba(accent, pass.alpha);
    ctx.shadowBlur = pass.blur;
    ctx.fillStyle = rgba(accent, 0.03);
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, winR);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0)';

  // 3. Phosphor highlight — soft glow around the cursor area.
  const promptCx = terminalX + (winW - bodyPadX * 2) * 0.3;
  const promptCy = promptY - tFontPx * 0.4;
  const phosphorR = Math.min(W, H) * 0.22;
  const phosphor = ctx.createRadialGradient(promptCx, promptCy, 0, promptCx, promptCy, phosphorR);
  const pPeak = intensity * 0.2;
  phosphor.addColorStop(0.0, rgba(accent, pPeak));
  phosphor.addColorStop(0.25, rgba(accent, pPeak * 0.6));
  phosphor.addColorStop(0.6, rgba(accent, pPeak * 0.18));
  phosphor.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = phosphor;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

function rgba(c: Rgb, alpha: number) {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
