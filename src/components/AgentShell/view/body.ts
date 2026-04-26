import type { Terminal } from '../domain/terminal';
import { hexToRgb } from '../util/hex-to-rgb';
import { roundRect } from '../util/round-rect';
import { MONO } from './fonts';
import type { Layout } from './layout';

const COLORS = {
  banner: 'rgba(232, 228, 220, 0.92)',
  hint: 'rgba(201, 200, 189, 0.55)',
  out: 'rgba(201,200,189,0.72)',
  in: 'rgba(201,200,189,0.36)',
  err: '#FF8B7A',
  promptDim: 'rgba(201, 200, 189, 0.52)',
  inputText: 'rgba(226, 225, 214, 0.95)',
} as const;

export function drawBody(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  terminal: Terminal,
  cursorOn: boolean,
  accent: string
) {
  const { winX, winY, winW, terminalX, promptY, tFontPx, tLineH, scale: s, visibleOutCap } = l;

  // — Banner at the top of the body —
  const topPad = 42 * s;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.18)';
  ctx.shadowBlur = 4 * s;
  ctx.font = `500 ${tFontPx * 1.02}px ${MONO}`;
  ctx.fillStyle = COLORS.banner;
  ctx.fillText('Peritissimus · agent shell v1.23', terminalX, winY + topPad);

  ctx.font = `${tFontPx * 0.92}px ${MONO}`;
  ctx.fillStyle = COLORS.hint;
  ctx.fillText("Type 'help' for commands, 'clear' to reset.", terminalX, winY + topPad + tLineH);

  // — Recent output —
  const visibleOut = terminal.outLines.slice(-visibleOutCap);
  let outY = promptY - tLineH * visibleOut.length - tLineH * 0.35;
  ctx.font = `${tFontPx}px ${MONO}`;
  for (const o of visibleOut) {
    ctx.fillStyle = o.kind === 'in' ? COLORS.in : o.kind === 'err' ? COLORS.err : COLORS.out;
    ctx.fillText(o.text, terminalX, outY);
    outY += tLineH;
  }
  ctx.shadowBlur = 0;

  // — Prompt highlight: subtle accent-tinted rounded pill behind the active line —
  const a = hexToRgb(accent);
  const padTop = 6 * s;
  const padBot = 7 * s;
  const hlX = terminalX - 8 * s;
  const hlY = promptY - tFontPx - padTop;
  const hlW = winW - (terminalX - winX) * 2 + 16 * s;
  const hlH = tFontPx + padTop + padBot;
  ctx.save();
  ctx.fillStyle = `rgba(${a.r}, ${a.g}, ${a.b}, 0.07)`;
  roundRect(ctx, hlX, hlY, hlW, hlH, 6 * s);
  ctx.fill();
  ctx.strokeStyle = `rgba(${a.r}, ${a.g}, ${a.b}, 0.18)`;
  ctx.lineWidth = 1 * s;
  ctx.stroke();
  ctx.restore();

  // — Prompt text on top of the highlight —
  ctx.shadowColor = `rgba(${a.r}, ${a.g}, ${a.b}, 0.4)`;
  ctx.shadowBlur = 6 * s;
  ctx.font = `600 ${tFontPx}px ${MONO}`;
  ctx.fillStyle = accent;
  const promptText = 'agent@peritissimus';
  ctx.fillText(promptText, terminalX, promptY);
  let px = terminalX + ctx.measureText(promptText).width;
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.promptDim;
  ctx.fillText(' ~ ', px, promptY);
  px += ctx.measureText(' ~ ').width;

  ctx.fillStyle = COLORS.inputText;
  ctx.fillText(terminal.input, px, promptY);
  px += ctx.measureText(terminal.input).width;

  if (cursorOn) {
    ctx.fillStyle = accent;
    ctx.fillText('▍', px, promptY);
  }
}
