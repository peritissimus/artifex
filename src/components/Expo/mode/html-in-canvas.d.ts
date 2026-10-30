// The parts of Chrome's HTML-in-Canvas API that Expo Mode uses. Not in TypeScript's DOM lib yet.
// https://github.com/WICG/html-in-canvas

interface UpdateElementGeometryOptions {
  canvasTransform?: DOMMatrixInit;
  preserveHitTestOrder?: boolean;
}

interface HTMLCanvasElement {
  requestPaint(): void;
  updateElementGeometry?(element: Element, options?: UpdateElementGeometryOptions): void;
}

interface WebGL2RenderingContext {
  texElementSubImage2D(
    target: GLenum,
    level: GLint,
    xoffset: GLint,
    yoffset: GLint,
    element: Element,
    config?: {
      sx?: number;
      sy?: number;
      swidth?: number;
      sheight?: number;
      width?: number;
      height?: number;
    }
  ): void;
}
