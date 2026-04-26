import type { Terminal } from '../domain/terminal';
import { MONO } from './fonts';
import type { Layout } from './layout';

const COLORS = {
  out: 'rgba(201,200,189,0.72)',
  in: 'rgba(201,200,189,0.36)',
  err: '#FF8B7A',
  hint: 'rgba(201,200,189,0.55)',
  prompt: 'rgba(201,200,189,0.52)',
  inputText: 'rgba(226, 225, 214, 0.95)',
} as const;

export function drawBody(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  terminal: Terminal,
  cursorOn: boolean,
  accent: string
) {
  const { bodyTop, terminalX, promptY, tFontPx, tLineH, scale: s, visibleOutCap } = l;

  ctx.shadowColor = 'rgba(255, 255, 255, 0.18)';
  ctx.shadowBlur = 5 * s;

  // Hint
  ctx.font = `${tFontPx * 0.9}px ${MONO}`;
  ctx.fillStyle = COLORS.hint;
  ctx.fillText("Type 'help' for commands, 'clear' to reset.", terminalX, bodyTop + 26 * s);

  // Recent output
  const visibleOut = terminal.outLines.slice(-visibleOutCap);
  let outY = promptY - tLineH * visibleOut.length - tLineH * 0.35;
  ctx.font = `${tFontPx}px ${MONO}`;
  for (const o of visibleOut) {
    ctx.fillStyle = o.kind === 'in' ? COLORS.in : o.kind === 'err' ? COLORS.err : COLORS.out;
    ctx.fillText(o.text, terminalX, outY);
    outY += tLineH;
  }

  // Prompt
  ctx.font = `700 ${tFontPx}px ${MONO}`;
  ctx.fillStyle = accent;
  ctx.fillText('agent@peritissimus', terminalX, promptY);
  let px = terminalX + ctx.measureText('agent@peritissimus').width;
  ctx.fillStyle = COLORS.prompt;
  ctx.fillText(' ~ ', px, promptY);
  px += ctx.measureText(' ~ ').width;
  ctx.fillStyle = COLORS.inputText;
  ctx.fillText(terminal.input, px, promptY);
  px += ctx.measureText(terminal.input).width;
  if (cursorOn) {
    ctx.fillStyle = accent;
    ctx.fillText('▍', px, promptY);
  }
  ctx.shadowBlur = 0;
}
