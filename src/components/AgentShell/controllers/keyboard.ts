export type KeyEvent =
  | { kind: 'submit' }
  | { kind: 'backspace' }
  | { kind: 'history-prev' }
  | { kind: 'history-next' }
  | { kind: 'clear-screen' }
  | { kind: 'scroll'; lines: number }
  | { kind: 'char'; ch: string }
  | { kind: 'set-input'; value: string };

type Listener = (e: KeyEvent) => void;

/**
 * Captures keyboard input at the document level and emits semantic terminal
 * events. Optional mobile <input> hooks the OS keyboard on touch devices —
 * its 'input' events become 'set-input' (whole-buffer replace) rather than
 * per-char appends, which matches how iOS dispatches autocorrected text.
 */
export class KeyboardController {
  private listeners = new Set<Listener>();

  constructor(private mobileInput?: HTMLInputElement) {
    document.addEventListener('keydown', this.handleKey);
    mobileInput?.addEventListener('input', this.handleMobileInput);
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Mirror an input value into the hidden mobile <input>, if present. */
  syncMobileInput(value: string) {
    if (this.mobileInput && this.mobileInput.value !== value) {
      this.mobileInput.value = value;
    }
  }

  dispose() {
    document.removeEventListener('keydown', this.handleKey);
    this.mobileInput?.removeEventListener('input', this.handleMobileInput);
    this.listeners.clear();
  }

  private emit(e: KeyEvent) {
    this.listeners.forEach((fn) => fn(e));
  }

  private handleKey = (e: KeyboardEvent) => {
    const ae = document.activeElement;
    const isMobile = ae === this.mobileInput;

    // Ignore typing in other inputs (control panel, etc.)
    if (
      ae &&
      !isMobile &&
      (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || (ae as HTMLElement).isContentEditable)
    ) {
      return;
    }

    // Mobile keyboard handles its own char/backspace via 'input' events.
    if (isMobile && (e.key.length === 1 || e.key === 'Backspace')) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.emit({ kind: 'submit' });
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.emit({ kind: 'backspace' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.shiftKey) this.emit({ kind: 'scroll', lines: 1 });
      else this.emit({ kind: 'history-prev' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.shiftKey) this.emit({ kind: 'scroll', lines: -1 });
      else this.emit({ kind: 'history-next' });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      this.emit({ kind: 'scroll', lines: 5 });
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      this.emit({ kind: 'scroll', lines: -5 });
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.emit({ kind: 'clear-screen' });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.emit({ kind: 'char', ch: e.key });
    }
  };

  private handleMobileInput = () => {
    this.emit({ kind: 'set-input', value: this.mobileInput?.value ?? '' });
  };
}
