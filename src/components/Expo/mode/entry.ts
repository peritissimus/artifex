// The switch for Expo Mode. Works out whether this browser can do it, owns the keyboard shortcut and
// the corner button, and only loads the 3D code once someone is actually going in.

import type { World } from './world';

const OPT_OUT = 'expo-149-flat';
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
/**
 * Exhibits are copied while sitting inside the canvas, so the canvas has to be taller than they
 * are, and the world's framing assumes the exhibits' desktop layout.
 */
const ROOMY = '(min-width: 900px) and (min-height: 600px)';

/** Chrome ships this behind a flag or an origin trial, so ask for exactly what gets used. */
function supported() {
  return (
    'requestPaint' in HTMLCanvasElement.prototype &&
    typeof WebGL2RenderingContext !== 'undefined' &&
    'texElementSubImage2D' in WebGL2RenderingContext.prototype
  );
}

function remember(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* Private window or blocked storage: the choice just won't persist. */
  }
}

function recall(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function startEntry() {
  const host = document.querySelector<HTMLElement>('#expo-sheet');
  const toggle = document.querySelector<HTMLButtonElement>('[data-expo-toggle]');
  const label = document.querySelector<HTMLElement>('[data-expo-toggle-label]');
  const gameButton = document.querySelector<HTMLButtonElement>('[data-expo-game]');
  const status = document.querySelector<HTMLElement>('[data-expo-status]');
  const how = document.querySelector<HTMLElement>('[data-expo-how]');
  const unsupported = document.querySelector<HTMLElement>('[data-expo-unsupported]');
  if (!host || !toggle) return;

  const showUnavailable = () => {
    if (how) how.hidden = true;
    if (unsupported) unsupported.hidden = false;
    toggle.hidden = true;
    if (gameButton) gameButton.hidden = true;
  };
  if (!supported()) {
    showUnavailable();
    return;
  }
  toggle.hidden = false;

  let world: World | null = null;
  let inside = false;
  let busy = false;

  const reflect = () => {
    toggle.setAttribute('aria-pressed', String(inside));
    if (label) label.textContent = inside ? 'Back to the page' : 'Expo Mode';
    if (gameButton) gameButton.hidden = !inside;
    if (status) status.textContent = inside ? 'Expo Mode on' : 'Expo Mode off';
  };

  const enter = async () => {
    if (busy || inside || !matchMedia(ROOMY).matches) return;
    busy = true;
    try {
      await document.fonts.ready;
      const { createWorld } = await import('./world');
      world ??= createWorld(
        host,
        () => {
          // The browser advertised the API but it didn't work out. Back to the page, for good.
          world = null;
          inside = false;
          busy = false;
          reflect();
          showUnavailable();
        },
        (running) => {
          toggle.hidden = running;
          if (gameButton) gameButton.hidden = running || !inside;
        }
      );
      inside = true;
      reflect();
      remember(OPT_OUT, null);
      await world.to(1);
    } catch (error) {
      console.error(error);
      showUnavailable();
    } finally {
      busy = false;
    }
  };

  const leave = async () => {
    if (busy || !inside || !world) return;
    busy = true;
    inside = false;
    reflect();
    remember(OPT_OUT, '1');
    await world.to(0);
    busy = false;
  };

  // A window shrunk too far goes back to the flat page; the button comes back with the room.
  const roomy = matchMedia(ROOMY);
  const syncRoom = () => {
    toggle.hidden = !roomy.matches;
    if (!roomy.matches && inside) leave();
  };
  roomy.addEventListener('change', syncRoom);
  syncRoom();

  toggle.addEventListener('click', () => (inside ? leave() : enter()));
  gameButton?.addEventListener('click', () => world?.startRun());

  window.addEventListener('keydown', (event) => {
    if (event.isComposing || event.defaultPrevented) return;
    const target = event.target as Element | null;
    if (event.key === 'Escape' && inside && !world?.running()) {
      // Escape leaves a text field first, the world second.
      if (target?.matches?.(EDITABLE)) {
        (target as HTMLElement).blur();
        return;
      }
      event.preventDefault();
      leave();
      return;
    }
    if (target?.matches?.(EDITABLE)) return;
    if (
      (event.key === '~' || event.code === 'Backquote') &&
      !event.repeat &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      event.preventDefault();
      if (inside) leave();
      else enter();
      return;
    }
    if (
      (event.key === 'g' || event.key === 'G') &&
      inside &&
      !event.repeat &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      event.preventDefault();
      world?.startRun();
    }
  });

  // Dedicated page, so going in is the default. `?flat`, reduced motion, or having left before all opt out.
  const params = new URLSearchParams(location.search);
  const wantsFlat =
    params.has('flat') ||
    (!params.has('expo-mode') &&
      (matchMedia('(prefers-reduced-motion: reduce)').matches || recall(OPT_OUT) === '1'));
  if (!wantsFlat) window.setTimeout(enter, 700);
}
