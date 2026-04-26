type DownListener = () => void;

/**
 * Tracks pointer position over the container as a smoothed normalized vector
 * (-1..1 on each axis, with 0,0 at the center). Call update() once per frame
 * to advance the smoothing.
 */
export class PointerController {
  mx = 0;
  my = 0;
  private targetMx = 0;
  private targetMy = 0;
  private downListeners = new Set<DownListener>();

  constructor(private container: HTMLElement) {
    container.addEventListener('pointerdown', this.handleDown);
    container.addEventListener('pointermove', this.handleMove);
    container.addEventListener('pointerleave', this.handleLeave);
  }

  onDown(fn: DownListener) {
    this.downListeners.add(fn);
    return () => this.downListeners.delete(fn);
  }

  update() {
    this.mx += (this.targetMx - this.mx) * 0.06;
    this.my += (this.targetMy - this.my) * 0.06;
  }

  dispose() {
    this.container.removeEventListener('pointerdown', this.handleDown);
    this.container.removeEventListener('pointermove', this.handleMove);
    this.container.removeEventListener('pointerleave', this.handleLeave);
    this.downListeners.clear();
  }

  private handleDown = () => {
    this.downListeners.forEach((fn) => fn());
  };

  private handleMove = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.targetMx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    this.targetMy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  private handleLeave = () => {
    this.targetMx = 0;
    this.targetMy = 0;
  };
}
