// The drafting layer: rulers, section marks, leader lines and dimensions, drawn each frame on a 2D
// canvas above the world. Every number on it is real, read from the page and the curve.

import type { Drawable, SectionInfo } from './sheet';

export type Projector = (
  x: number,
  pageY: number,
  height: number
) => { x: number; y: number; visible: boolean };

export type OverlayFrame = {
  width: number;
  height: number;
  near: number;
  amount: number;
  fade: number;
  sheetWidth: number;
  pageHeight: number;
  curveStart: number;
  sections: SectionInfo[];
  active: number;
  drawables: Drawable[];
  finale: number;
  /** How much of the "scroll" prompt to show. */
  hint: number;
  pavilionCount: number;
  project: Projector;
  angleAt: (s: number) => number;
  railPoint: { x: number; y: number } | null;
  cursor: { x: number; y: number; s: number; angle: number } | null;
};

const INK = '245, 238, 222';
const FONT = '500 11px ui-monospace, "SF Mono", Menlo, monospace';
const FONT_LARGE = '500 15px ui-monospace, "SF Mono", Menlo, monospace';
const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

export class Overlay {
  readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d')!;
  private ratio = 1;

  constructor() {
    this.canvas.className = 'expo-overlay';
    this.canvas.setAttribute('aria-hidden', 'true');
  }

  resize(width: number, height: number, ratio: number) {
    this.ratio = ratio;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
  }

  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Draw one frame of annotations. */
  drawOverlay(f: OverlayFrame) {
    this.clear();
    const { ctx } = this;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.caption(f);
    if (f.fade <= 0.01) return;
    ctx.globalAlpha = f.fade;
    ctx.lineWidth = 1;
    ctx.textBaseline = 'middle';
    this.rulers(f);
    this.sectionMarks(f);
    this.callouts(f);
    this.formula(f);
    this.readout(f);
    this.prompt(f);
    ctx.globalAlpha = 1;
  }

  private caption(f: OverlayFrame) {
    const alpha = ease((f.finale - 0.72) / 0.28);
    if (alpha <= 0) return;
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = `rgb(${INK})`;
    ctx.font = `700 ${Math.round(Math.min(f.width * 0.04, 56))}px "Barlow Semi Condensed", "Arial Narrow", sans-serif`;
    ctx.fillText('THE WHOLE SHEET', f.width / 2, f.height - 92);
    ctx.font = FONT_LARGE;
    ctx.fillText(
      `${f.pageHeight.toLocaleString()} px of paper · ${f.pavilionCount} pavilions · one curve`,
      f.width / 2,
      f.height - 64
    );
    ctx.fillStyle = `rgba(${INK}, 0.6)`;
    ctx.font = FONT;
    ctx.fillText('Scroll up to walk back in', f.width / 2, f.height - 42);
    ctx.globalAlpha = 1;
  }

  private rulers(f: OverlayFrame) {
    const { ctx } = this;
    const half = f.sheetWidth / 2;
    const reach = f.curveStart + 2600;
    const first = Math.ceil((f.near - reach) / 500) * 500;
    ctx.font = FONT;
    for (let py = Math.max(0, first); py <= Math.min(f.pageHeight, f.near + 400); py += 500) {
      const s = f.near - py;
      const alpha = ease((reach - s) / 900) * ease((s + 400) / 300);
      if (alpha <= 0) continue;
      for (const side of [-1, 1]) {
        const a = f.project(side * half, py, 0);
        const b = f.project(side * (half + 26), py, 0);
        if (!a.visible || !b.visible) continue;
        ctx.strokeStyle = `rgba(${INK}, ${0.65 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${INK}, ${0.72 * alpha})`;
        ctx.textAlign = side < 0 ? 'right' : 'left';
        ctx.fillText(String(py), b.x + side * 6, b.y);
      }
    }
  }

  private sectionMarks(f: OverlayFrame) {
    const { ctx } = this;
    const half = f.sheetWidth / 2;
    ctx.font = FONT;
    f.sections.forEach((section) => {
      const s = f.near - section.top;
      const alpha = ease((f.curveStart + 2200 - s) / 900) * ease((s + 200) / 300);
      if (alpha <= 0) return;
      for (const side of [-1, 1]) {
        const a = f.project(side * half, section.top, 0);
        const b = f.project(side * (half + 120), section.top, 0);
        if (!a.visible || !b.visible) continue;
        ctx.strokeStyle = `rgba(${INK}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${INK}, ${alpha})`;
        ctx.textAlign = side < 0 ? 'right' : 'left';
        ctx.fillText(section.title, b.x + side * 8, b.y);
      }
    });
  }

  private callouts(f: OverlayFrame) {
    const { ctx } = this;
    for (const d of f.drawables) {
      if (d.kind !== 'plinth') continue;
      const s = f.near - (d.y + d.h);
      const alpha = ease((1900 - s) / 500) * ease((s + 300) / 300);
      if (alpha <= 0.01) continue;

      const top = d.lift;
      const nearRight = f.project(d.x + d.w - f.sheetWidth / 2, d.y + d.h, top);
      const base = f.project(d.x + d.w - f.sheetWidth / 2, d.y + d.h, 0);
      const farRight = f.project(d.x + d.w - f.sheetWidth / 2, d.y, top);
      const farLeft = f.project(d.x - f.sheetWidth / 2, d.y, top);
      if (!nearRight.visible || !farRight.visible || !farLeft.visible) continue;

      ctx.strokeStyle = `rgba(${INK}, ${alpha})`;
      ctx.fillStyle = `rgba(${INK}, ${alpha})`;

      // Dimension along the near edge, just off the paper.
      const dimA = f.project(d.x - f.sheetWidth / 2, d.y + d.h + 22, 0);
      const dimB = f.project(d.x + d.w - f.sheetWidth / 2, d.y + d.h + 22, 0);
      if (dimA.visible && dimB.visible) {
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(dimA.x, dimA.y);
        ctx.lineTo(dimB.x, dimB.y);
        ctx.moveTo(dimA.x, dimA.y - 5);
        ctx.lineTo(dimA.x, dimA.y + 5);
        ctx.moveTo(dimB.x, dimB.y - 5);
        ctx.lineTo(dimB.x, dimB.y + 5);
        ctx.stroke();
        const label = `Δx ${Math.round(d.w)} px`;
        ctx.font = FONT;
        ctx.textAlign = 'center';
        const cx = (dimA.x + dimB.x) / 2;
        const cy = (dimA.y + dimB.y) / 2;
        const textWidth = ctx.measureText(label).width + 12;
        ctx.clearRect(cx - textWidth / 2, cy - 8, textWidth, 16);
        ctx.fillText(label, cx, cy);
      }

      // Height of the plinth off the paper, and the surface angle where it stands.
      if (base.visible && top > 2) {
        ctx.beginPath();
        ctx.moveTo(base.x + 8, base.y);
        ctx.lineTo(nearRight.x + 8, nearRight.y);
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.font = FONT;
        const angle = f.angleAt(f.near - (d.y + d.h / 2));
        ctx.fillText(`z ${Math.round(top)} px`, base.x + 14, (base.y + nearRight.y) / 2 - 7);
        ctx.fillText(`θ ${angle.toFixed(1)}°`, base.x + 14, (base.y + nearRight.y) / 2 + 7);
      }

      // Leader from the far corner out to the exhibit's name.
      const title = d.el.dataset.title ?? '';
      const out = farRight.x + 26;
      const rise = farRight.y - 34;
      ctx.beginPath();
      ctx.moveTo(farRight.x, farRight.y);
      ctx.lineTo(out, rise);
      ctx.font = FONT_LARGE;
      const titleWidth = ctx.measureText(title).width;
      const fits = out + titleWidth < f.width - 12;
      const end = fits ? out + titleWidth : out - titleWidth;
      ctx.lineTo(end, rise);
      ctx.stroke();
      ctx.textAlign = fits ? 'left' : 'right';
      ctx.fillText(title, out, rise - 10);

      // Corner tick.
      ctx.beginPath();
      ctx.arc(farRight.x, farRight.y, 3, 0, Math.PI * 2);
      ctx.stroke();

      // A long curve from the index rail to the exhibit that belongs to the current section.
      if (f.railPoint && d.section === f.active) {
        const p = f.railPoint;
        ctx.strokeStyle = `rgba(${INK}, ${0.8 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.bezierCurveTo(p.x + 120, p.y, farLeft.x - 150, farLeft.y, farLeft.x, farLeft.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(farLeft.x, farLeft.y, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private formula(f: OverlayFrame) {
    const { ctx } = this;
    // Pinned to the paper at the point where it starts to lift.
    const py = f.near - f.curveStart;
    const a = f.project(f.sheetWidth / 2 + 320, py, 0);
    if (!a.visible) return;
    ctx.font = FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = `rgba(${INK}, 0.8)`;
    const x = Math.min(a.x, f.width - 150);
    ctx.fillText('κ(s) = s / A²', x, a.y);
    ctx.fillStyle = `rgba(${INK}, 0.5)`;
    ctx.fillText('Euler spiral begins', x, a.y + 14);
  }

  private prompt(f: OverlayFrame) {
    if (f.hint <= 0.01) return;
    const { ctx } = this;
    const previous = ctx.globalAlpha;
    ctx.globalAlpha = previous * f.hint;
    const x = f.width / 2;
    const y = f.height - 34;
    ctx.fillStyle = 'rgba(11, 10, 8, 0.82)';
    ctx.fillRect(x - 116, y - 15, 232, 30);
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgb(${INK})`;
    ctx.fillText('SCROLL TO WIND THE SHEET ↓', x, y);
    ctx.globalAlpha = previous;
  }

  private readout(f: OverlayFrame) {
    if (!f.cursor) return;
    const { ctx } = this;
    ctx.font = FONT;
    ctx.textAlign = 'right';
    ctx.fillStyle = `rgba(${INK}, 0.85)`;
    const text = `x ${Math.round(f.cursor.x)}   y ${Math.round(f.cursor.y)}   s ${Math.round(f.cursor.s)}   θ ${f.cursor.angle.toFixed(1)}°`;
    ctx.fillText(text, f.width - 16, f.height - 26);
  }
}
