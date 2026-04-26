import type { AgentParams } from '../params';
import { clamp } from '../util/clamp';

export type Layout = {
  // canvas dimensions (device pixels) and css equivalents
  W: number;
  H: number;
  cssW: number;
  cssH: number;
  scale: number;
  // window
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  winR: number;
  titleBarH: number;
  // body content
  bodyTop: number;
  bodyPadX: number;
  terminalX: number;
  promptY: number;
  // text
  tFontPx: number;
  tLineH: number;
  visibleOutCap: number;
  // body region in UV (for shader masking; flipped because texture is flipY)
  bodyUvMin: { x: number; y: number };
  bodyUvMax: { x: number; y: number };
};

const MAX_CONTENT_CSS = 880;

export function computeLayout(W: number, H: number, scale: number, params: AgentParams): Layout {
  const cssW = W / scale;
  const cssH = H / scale;
  const codeFontCss = clamp(params.fontSize, cssW < 720 ? 13 : 16, cssW < 720 ? 16 : 22);

  const colCss = Math.min(cssW, MAX_CONTENT_CSS);
  const colLeft = ((cssW - colCss) / 2) * scale;
  const colWidth = colCss * scale;

  const winInsetCss = clamp(colCss * 0.04, 12, 28);
  const winX = colLeft + winInsetCss * scale;
  const winW = colWidth - winInsetCss * scale * 2;
  const winH = clamp(cssH * 0.3, 220, 300) * scale;
  const winY = (H - winH) / 2;
  const winR = 22 * scale;
  const titleBarH = 34 * scale;

  const bodyTop = winY + titleBarH;
  const bodyPadX = clamp(cssW * 0.02, 18, 30) * scale;
  const tFontPx = clamp(codeFontCss * 0.82, 12, 17) * scale;
  const tLineH = tFontPx * 1.45;
  const visibleOutCap = cssH < 620 ? 2 : 3;
  const terminalX = winX + bodyPadX;
  const promptY = winY + winH - 22 * scale;

  return {
    W,
    H,
    cssW,
    cssH,
    scale,
    winX,
    winY,
    winW,
    winH,
    winR,
    titleBarH,
    bodyTop,
    bodyPadX,
    terminalX,
    promptY,
    tFontPx,
    tLineH,
    visibleOutCap,
    bodyUvMin: { x: winX / W, y: 1 - (winY + winH) / H },
    bodyUvMax: { x: (winX + winW) / W, y: 1 - (winY + titleBarH) / H },
  };
}
