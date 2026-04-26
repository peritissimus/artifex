import { COMMANDS } from './commands';

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
  private history: string[] = [];
  private histIdx = -1;
  private listeners = new Set<ChangeListener>();

  onChange(fn: ChangeListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setInput(value: string) {
    if (this.input === value) return;
    this.input = value;
    this.emit();
  }

  appendInput(ch: string) {
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
    if (this.outLines.length === 0) return;
    this.outLines = [];
    this.emit();
  }

  submit() {
    const trimmed = this.input.trim();
    this.print(`agent@peritissimus ~ ${trimmed}`, 'in');
    if (trimmed) {
      this.history.push(trimmed);
      this.runCommand(trimmed);
    }
    this.input = '';
    this.histIdx = this.history.length;
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
