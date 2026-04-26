type Listener = (w: number, h: number) => void;

/**
 * Watches the container with a ResizeObserver and emits its current pixel
 * dimensions. Use trigger() to fire synchronously after wiring listeners
 * in a constructor (the observer's initial fire is async).
 */
export class ResizeController {
  private listeners = new Set<Listener>();
  private observer: ResizeObserver;

  constructor(private container: HTMLElement) {
    this.observer = new ResizeObserver(() => this.emit());
    this.observer.observe(container);
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  trigger() {
    this.emit();
  }

  dispose() {
    this.observer.disconnect();
    this.listeners.clear();
  }

  private emit() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.listeners.forEach((fn) => fn(w, h));
  }
}
