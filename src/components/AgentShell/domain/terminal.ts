import { COMMANDS, INTRO_LINES } from './commands';

export type OutKind = 'out' | 'in' | 'err';
export type OutLine = { text: string; kind: OutKind };

type ChangeListener = () => void;

/**
 * Terminal owns the input buffer, command history, and output log.
 * It dispatches commands but knows nothing about rendering or input devices —
 * controllers translate device events into Terminal method calls.
 */
export class Terminal {
  input = '';
  outLines: OutLine[] = [];
  scrollOffset = 0;
  private history: string[] = [];
  private histIdx = -1;
  private listeners = new Set<ChangeListener>();
  private introQueue: OutLine[] = [];
  private introTimers: number[] = [];

  onChange(fn: ChangeListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Seed the greeting so the shell never opens on an empty prompt. Lines
   * reveal on a stagger so it reads as if it typed itself in; any real input
   * (see finishIntro) snaps the rest in immediately. Reduced motion seeds all
   * at once.
   */
  boot(reducedMotion = false) {
    if (this.outLines.length > 0 || this.introQueue.length > 0) return;
    const lines = INTRO_LINES.map((l) => ({ text: l.text, kind: l.kind }) as OutLine);
    if (reducedMotion) {
      this.outLines = lines;
      this.emit();
      return;
    }
    const STEP_MS = 90;
    this.introQueue = lines;
    lines.forEach((_, i) => {
      this.introTimers.push(window.setTimeout(() => this.revealNextIntroLine(), STEP_MS * (i + 1)));
    });
  }

  private revealNextIntroLine() {
    const next = this.introQueue.shift();
    if (!next) return;
    this.outLines.push(next);
    this.emit();
  }

  /** Flush any still-pending greeting lines at once and cancel the stagger. */
  private finishIntro() {
    if (this.introTimers.length === 0 && this.introQueue.length === 0) return;
    this.introTimers.forEach((t) => clearTimeout(t));
    this.introTimers = [];
    if (this.introQueue.length) {
      this.outLines.push(...this.introQueue);
      this.introQueue = [];
      this.emit();
    }
  }

  /** Cancel any in-flight greeting timers (unmount). */
  dispose() {
    this.introTimers.forEach((t) => clearTimeout(t));
    this.introTimers = [];
    this.introQueue = [];
  }

  setInput(value: string) {
    if (this.input === value) return;
    if (value) this.finishIntro();
    this.input = value;
    this.emit();
  }

  appendInput(ch: string) {
    this.finishIntro();
    this.input += ch;
    this.emit();
  }

  backspace() {
    if (!this.input) return;
    this.input = this.input.slice(0, -1);
    this.emit();
  }

  historyPrev() {
    if (this.history.length === 0) return;
    this.histIdx = Math.max(0, this.histIdx - 1);
    this.input = this.history[this.histIdx] ?? '';
    this.emit();
  }

  historyNext() {
    this.histIdx = Math.min(this.history.length, this.histIdx + 1);
    this.input = this.history[this.histIdx] ?? '';
    this.emit();
  }

  clearScreen() {
    this.dispose();
    if (this.outLines.length === 0 && this.scrollOffset === 0) return;
    this.outLines = [];
    this.scrollOffset = 0;
    this.emit();
  }

  scrollBy(lines: number) {
    const max = this.outLines.length;
    const next = Math.max(0, Math.min(max, this.scrollOffset + lines));
    if (next === this.scrollOffset) return;
    this.scrollOffset = next;
    this.emit();
  }

  scrollToBottom() {
    if (this.scrollOffset === 0) return;
    this.scrollOffset = 0;
    this.emit();
  }

  submit() {
    this.finishIntro();
    const trimmed = this.input.trim();
    if (!trimmed) {
      // Empty Enter — clear any whitespace from the buffer but don't echo.
      if (this.input) {
        this.input = '';
        this.emit();
      }
      return;
    }
    this.print(`peritissimus@web ~ ${trimmed}`, 'in');
    this.history.push(trimmed);
    this.runCommand(trimmed);
    this.input = '';
    this.histIdx = this.history.length;
    this.scrollOffset = 0;
    this.emit();
  }

  private print(text: string, kind: OutKind = 'out') {
    this.outLines.push({ text, kind });
  }

  private runCommand(raw: string) {
    const [cmd, ...args] = raw.split(/\s+/);
    const lc = cmd.toLowerCase();
    if (lc === 'clear') {
      this.outLines = [];
      this.scrollOffset = 0;
      return;
    }
    if (lc === 'echo') {
      this.print(args.join(' '));
      return;
    }
    const fn = COMMANDS[lc];
    if (!fn) {
      this.print(`command not found: ${cmd} — try 'help'`, 'err');
      return;
    }
    const result = fn();
    if (typeof result === 'string') {
      if (result) this.print(result);
    } else {
      result.forEach((line) => this.print(line));
    }
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }
}
