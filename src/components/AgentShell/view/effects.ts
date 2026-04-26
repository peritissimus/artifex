import { roundRect } from '../util/round-rect';
import type { Layout } from './layout';

/** Darken horizontal stripes inside the entire window (no title bar). */
export function drawScanlines(ctx: CanvasRenderingContext2D, l: Layout, intensity: number) {
  if (intensity <= 0) return;
  const { winX, winY, winW, winH, winR, scale: s } = l;

  ctx.save();
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.clip();

  ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.55})`;
  const period = 2 * s;
  const lineH = 1 * s;
  for (let y = winY; y < winY + winH; y += period) {
    ctx.fillRect(winX, y, winW, lineH);
  }
  ctx.restore();
}
