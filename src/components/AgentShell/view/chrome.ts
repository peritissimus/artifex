import { roundRect } from '../util/round-rect';
import type { Layout } from './layout';

/**
 * Minimal terminal frame: a thin rounded outline with a barely-there
 * dark fill so the bg shows through. No title bar, no traffic lights.
 * The window reads as a hovering pane of glass over the room.
 */
export function drawChrome(ctx: CanvasRenderingContext2D, l: Layout) {
  const { winX, winY, winW, winH, winR, scale: s } = l;

  // Soft halo behind the window, grounding it in the room.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 80 * s;
  ctx.shadowOffsetY = 6 * s;
  ctx.fillStyle = 'rgba(6, 7, 8, 0.85)';
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.fill();
  ctx.restore();

  // Body fill — translucent so the bg reads through, but solid enough to
  // give the text a clear backdrop.
  ctx.save();
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.clip();
  const bodyGrad = ctx.createLinearGradient(0, winY, 0, winY + winH);
  bodyGrad.addColorStop(0, 'rgba(10, 12, 14, 0.62)');
  bodyGrad.addColorStop(1, 'rgba(4, 5, 6, 0.72)');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(winX, winY, winW, winH);
  ctx.restore();

  // Thin outer border — clearly visible, defines the rounded edge.
  ctx.save();
  ctx.lineWidth = 1 * s;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  roundRect(ctx, winX + 0.5 * s, winY + 0.5 * s, winW - 1 * s, winH - 1 * s, winR);
  ctx.stroke();
  ctx.restore();
}
