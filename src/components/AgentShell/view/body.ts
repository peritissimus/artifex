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

  // — Hint line, only shown before any output exists —
  if (terminal.outLines.length === 0) {
    const topPad = 42 * s;
    ctx.font = `${tFontPx * 0.92}px ${MONO}`;
    ctx.fillStyle = COLORS.hint;
    ctx.fillText("Type 'help' for commands, 'clear' to reset.", terminalX, winY + topPad);
  }

  // — Recent output (with scroll offset) —
  const total = terminal.outLines.length;
  const maxOffset = Math.max(0, total - visibleOutCap);
  const offset = Math.min(terminal.scrollOffset, maxOffset);
  const end = total - offset;
  const aboveCount = Math.max(0, end - visibleOutCap);
  const showIndicator = aboveCount > 0;
  // When the indicator is on, it takes one of the visible slots so the row
  // count stays the same — the topmost output line gets sacrificed.
  const sliceStart = aboveCount + (showIndicator ? 1 : 0);
  const visibleOut = terminal.outLines.slice(sliceStart, end);
  const hiddenAbove = sliceStart;
  const rowCount = visibleOut.length + (showIndicator ? 1 : 0);

  let outY = promptY - tLineH * rowCount - tLineH * 0.35;
  ctx.font = `${tFontPx}px ${MONO}`;
  if (showIndicator) {
    ctx.fillStyle = COLORS.hint;
    ctx.fillText(`⋮ ${hiddenAbove} more above`, terminalX, outY);
    outY += tLineH;
  }
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
  const promptText = 'peritissimus@web';
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
