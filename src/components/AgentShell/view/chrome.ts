import { roundRect } from '../util/round-rect';
import type { Layout } from './layout';

/**
 * Minimal terminal frame: a thin rounded outline with a barely-there
 * dark fill so the bg shows through. No title bar, no traffic lights.
 * The window reads as a hovering pane of glass over the room.
 */
export function drawChrome(ctx: CanvasRenderingContext2D, l: Layout) {
  const { winX, winY, winW, winH, winR, scale: s } = l;

  // Soft halo behind the window — fill is mostly transparent so the bg
  // reads through; shadowColor carries the cast shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 110 * s;
  ctx.shadowOffsetY = 6 * s;
  ctx.fillStyle = 'rgba(6, 7, 8, 0.08)';
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.fill();
  ctx.restore();

  // Body fill — light translucent gradient.
  ctx.save();
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.clip();
  const bodyGrad = ctx.createLinearGradient(0, winY, 0, winY + winH);
  bodyGrad.addColorStop(0, 'rgba(16, 18, 22, 0.08)');
  bodyGrad.addColorStop(1, 'rgba(10, 11, 14, 0.14)');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(winX, winY, winW, winH);
  ctx.restore();

  // Thin outer border — soft, defines the rounded edge.
  ctx.save();
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  roundRect(ctx, winX + 0.75 * s, winY + 0.75 * s, winW - 1.5 * s, winH - 1.5 * s, winR);
  ctx.stroke();
  ctx.restore();
}
