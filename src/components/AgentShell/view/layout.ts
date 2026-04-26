import type { AgentParams } from '../params';
import { clamp } from '../util/clamp';

const MAX_CONTENT_CSS = 1100;
const WIN_RADIUS_CSS = 22;

export type WindowSize = { w: number; h: number; r: number };

export type Layout = {
  // canvas dimensions (device pixels) and css equivalents
  W: number;
  H: number;
  cssW: number;
  cssH: number;
  scale: number;
  // window — for the shell layer the shell canvas IS the window, so winX=winY=0
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  winR: number;
  // body content
  bodyPadX: number;
  terminalX: number;
  promptY: number;
  // text
  tFontPx: number;
  tLineH: number;
  visibleOutCap: number;
};

/**
 * Compute the size of the terminal window for a given viewport. Used to
 * size the shell mesh + canvas, and to tell the bg layer where the shell
 * sits on screen.
 */
export function computeWindowSize(cssW: number, cssH: number): WindowSize {
  const colCss = Math.min(cssW, MAX_CONTENT_CSS);
  const winInsetCss = clamp(colCss * 0.04, 12, 28);
  const w = colCss - winInsetCss * 2;
  const h = clamp(cssH * 0.4, 260, 420);
  return { w, h, r: WIN_RADIUS_CSS };
}

/**
 * Compute the canvas-2D layout for drawing into a shell-sized texture.
 * W, H are the shell canvas dimensions in device pixels.
 */
export function computeLayout(W: number, H: number, scale: number, params: AgentParams): Layout {
  const cssW = W / scale;
  const cssH = H / scale;
  const codeFontCss = clamp(params.fontSize, 13, 22);
  const winR = WIN_RADIUS_CSS * scale;
  const bodyPadX = clamp(cssW * 0.02, 18, 30) * scale;
  const tFontPx = clamp(codeFontCss * 0.82, 12, 17) * scale;
  const tLineH = tFontPx * 1.45;
  const visibleOutCap = cssH < 240 ? 2 : 3;

  return {
    W,
    H,
    cssW,
    cssH,
    scale,
    winX: 0,
    winY: 0,
    winW: W,
    winH: H,
    winR,
    bodyPadX,
    terminalX: bodyPadX,
    promptY: H - 32 * scale,
    tFontPx,
    tLineH,
    visibleOutCap,
  };
}
