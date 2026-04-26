type DownListener = () => void;
type WheelListener = (lines: number) => void;

const WHEEL_PX_PER_LINE = 60;

/**
 * Tracks pointer position over the container as a smoothed normalized vector
 * (-1..1 on each axis, with 0,0 at the center). Call update() once per frame
 * to advance the smoothing. Also surfaces wheel events as discrete line steps
 * for terminal scrolling.
 */
export class PointerController {
  mx = 0;
  my = 0;
  private targetMx = 0;
  private targetMy = 0;
  private downListeners = new Set<DownListener>();
  private wheelListeners = new Set<WheelListener>();
  private wheelBuffer = 0;

  constructor(private container: HTMLElement) {
    container.addEventListener('pointerdown', this.handleDown);
    container.addEventListener('pointermove', this.handleMove);
    container.addEventListener('pointerleave', this.handleLeave);
    container.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  onDown(fn: DownListener) {
    this.downListeners.add(fn);
    return () => this.downListeners.delete(fn);
  }

  onWheel(fn: WheelListener) {
    this.wheelListeners.add(fn);
    return () => this.wheelListeners.delete(fn);
  }

  update() {
    this.mx += (this.targetMx - this.mx) * 0.06;
    this.my += (this.targetMy - this.my) * 0.06;
  }

  dispose() {
    this.container.removeEventListener('pointerdown', this.handleDown);
    this.container.removeEventListener('pointermove', this.handleMove);
    this.container.removeEventListener('pointerleave', this.handleLeave);
    this.container.removeEventListener('wheel', this.handleWheel);
    this.downListeners.clear();
    this.wheelListeners.clear();
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

  private handleWheel = (e: WheelEvent) => {
    // Let the tweaks panel scroll itself.
    if ((e.target as HTMLElement | null)?.closest('.ctrl')) return;
    e.preventDefault();
    this.wheelBuffer += e.deltaY;
    const delta = Math.trunc(this.wheelBuffer / WHEEL_PX_PER_LINE);
    if (delta === 0) return;
    this.wheelBuffer -= delta * WHEEL_PX_PER_LINE;
    // deltaY > 0 = wheel toward user = view newer content = scroll forward.
    this.wheelListeners.forEach((fn) => fn(-delta));
  };
}
