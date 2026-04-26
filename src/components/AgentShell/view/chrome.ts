import { roundRect } from '../util/round-rect';
import { MONO } from './fonts';
import type { Layout } from './layout';

const TRAFFIC_LIGHTS = [
  { fill: '#FF5F57', stroke: '#E0443E' },
  { fill: '#FEBC2E', stroke: '#DEA123' },
  { fill: '#28C840', stroke: '#1AAB29' },
];

export function drawChrome(ctx: CanvasRenderingContext2D, l: Layout) {
  const { winX, winY, winW, winH, winR, titleBarH, scale: s } = l;

  // Two-pass diffuse shadow — feathers the window edge into the bg so corners
  // read as "fading" rather than crisply outlined. The first pass is wide and
  // centered (halo), the second is small and offset (grounding shadow).
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 90 * s;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(8, 9, 10, 0.95)';
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 30 * s;
  ctx.shadowOffsetY = 12 * s;
  ctx.fillStyle = 'rgba(8, 9, 10, 0.95)';
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.fill();
  ctx.restore();

  // Body + title bar fills, clipped to window shape.
  ctx.save();
  roundRect(ctx, winX, winY, winW, winH, winR);
  ctx.clip();

  const titleGrad = ctx.createLinearGradient(0, winY, 0, winY + titleBarH);
  titleGrad.addColorStop(0, 'rgba(34, 36, 38, 0.96)');
  titleGrad.addColorStop(1, 'rgba(22, 24, 26, 0.96)');
  ctx.fillStyle = titleGrad;
  ctx.fillRect(winX, winY, winW, titleBarH);

  const bodyGrad = ctx.createLinearGradient(0, winY + titleBarH, 0, winY + winH);
  bodyGrad.addColorStop(0, 'rgba(11, 12, 13, 0.92)');
  bodyGrad.addColorStop(1, 'rgba(4, 5, 5, 0.94)');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(winX, winY + titleBarH, winW, winH - titleBarH);

  // Hairline separating title bar from body
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(winX, winY + titleBarH, winW, 1 * s);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(winX, winY + titleBarH + 1 * s, winW, 1 * s);
  ctx.restore();

  // Outer border — barely there, just a hint to define the rounded edge.
  ctx.save();
  ctx.lineWidth = 1 * s;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  roundRect(ctx, winX + 0.5 * s, winY + 0.5 * s, winW - 1 * s, winH - 1 * s, winR);
  ctx.stroke();
  ctx.restore();

  // Traffic lights
  const lightR = 6.5 * s;
  const lightGap = 19 * s;
  const lightCx0 = winX + 16 * s + lightR;
  const lightCy = winY + titleBarH / 2;
  TRAFFIC_LIGHTS.forEach((dot, i) => {
    ctx.beginPath();
    ctx.arc(lightCx0 + lightGap * i, lightCy, lightR, 0, Math.PI * 2);
    ctx.fillStyle = dot.fill;
    ctx.fill();
    ctx.lineWidth = 0.6 * s;
    ctx.strokeStyle = dot.stroke;
    ctx.stroke();
  });

  // Title bar text — centered, dim
  const titleFontPx = 12.5 * s;
  ctx.font = `500 ${titleFontPx}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(201, 200, 189, 0.55)';
  ctx.fillText(
    'agent@peritissimus — agent shell · v1.23',
    winX + winW / 2,
    lightCy + titleFontPx * 0.36
  );
  ctx.textAlign = 'left';
}
