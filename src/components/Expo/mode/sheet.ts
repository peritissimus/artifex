// Keeps the page's pixels on the GPU. The whole page is one drawable element: the sheet is cut into
// horizontal tiles of it, and plinths and headings are copies of their own part. Uploads are budgeted
// per frame and driven by what actually changed, because the browser only says the root changed.

import * as THREE from 'three';

export const TILE_HEIGHT = 1024;
const LOW_SCALE = 0.4;
/** How many high-resolution tiles may stay on the GPU. */
const HIGH_LIMIT = 7;

export type DrawableKind = 'plinth' | 'extrude';

export type Drawable = {
  el: HTMLElement;
  kind: DrawableKind;
  x: number;
  y: number;
  w: number;
  h: number;
  section: number;
  map: THREE.ExternalTexture;
  texture: WebGLTexture | null;
  uploaded: boolean;
  dirty: boolean;
  dirtyUntil: number;
  live: boolean;
  /** Current raised height off the paper, in pixels. */
  lift: number;
};

export type Tile = {
  index: number;
  top: number;
  height: number;
  map: THREE.ExternalTexture;
  high: WebGLTexture | null;
  low: WebGLTexture | null;
  highStale: boolean;
  lowStale: boolean;
};

export type SectionInfo = {
  el: HTMLElement;
  id: string;
  title: string;
  top: number;
  height: number;
  stock: string;
};

/**
 * Where an element sits on the sheet, measured against the first section so it holds however far the
 * DOM has been slid. Not offsetTop: inside the sticky canvas that grows with the scroll position, and
 * rounding at each ancestor would drift by up to a pixel, when a copy needs to land exactly.
 */
export function pageBox(el: Element, host: HTMLElement) {
  const origin = (host.firstElementChild as HTMLElement).getBoundingClientRect();
  const box = el.getBoundingClientRect();
  return { x: box.left - origin.left, y: box.top - origin.top, w: box.width, h: box.height };
}

const EVENTS = [
  'pointerover',
  'pointerout',
  'pointerdown',
  'pointerup',
  'click',
  'input',
  'change',
  'focusin',
  'focusout',
  'keydown',
  'keyup',
  'scroll',
  'toggle',
  'transitionrun',
  'transitionend',
  'animationstart',
  'animationend',
  'load',
];

export class Sheet {
  width = 0;
  height = 0;
  sections: SectionInfo[] = [];
  drawables: Drawable[] = [];
  tiles: Tile[] = [];
  uploads = 0;

  private readonly gl: WebGL2RenderingContext;
  private readonly anisotropy: EXT_texture_filter_anisotropic | null;
  private readonly maxAnisotropy: number;
  private readonly blank: WebGLTexture;
  private highScale = 1;
  private highFree: WebGLTexture[] = [];
  private lowFree: WebGLTexture[] = [];
  private observer: MutationObserver | null = null;
  private listening = new AbortController();
  private frame = 0;

  constructor(
    gl: WebGL2RenderingContext,
    private readonly host: HTMLElement,
    private readonly root: HTMLElement
  ) {
    this.gl = gl;
    this.anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
    this.maxAnisotropy = this.anisotropy
      ? Math.min(16, gl.getParameter(this.anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
      : 1;
    this.blank = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.blank);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([11, 10, 8, 255])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  /** Read the page's layout. Safe to call again after a resize. */
  measure(pixelRatio: number) {
    this.disposeTextures();
    this.width = this.host.clientWidth;
    this.highScale = Math.min(pixelRatio, 2);

    const place = (el: HTMLElement) => pageBox(el, this.host);

    this.sections = [...this.host.querySelectorAll<HTMLElement>('[data-expo-section]')].map(
      (el) => {
        const box = place(el);
        return {
          el,
          id: el.id,
          title: el.dataset.title ?? '',
          top: box.y,
          height: box.h,
          stock: getComputedStyle(el).getPropertyValue('--stock').trim(),
        };
      }
    );
    const last = this.sections[this.sections.length - 1];
    this.height = last ? last.top + last.height : 0;

    this.drawables = [...this.host.querySelectorAll<HTMLElement>('[data-expo]')].map((el) => {
      const { x, y, w, h } = place(el);
      const section = this.sections.findLastIndex((item) => item.top <= y);
      return {
        el,
        kind: el.dataset.expo as DrawableKind,
        x,
        y,
        w,
        h,
        section,
        map: new THREE.ExternalTexture(this.blank),
        texture: null,
        uploaded: false,
        dirty: false,
        dirtyUntil: 0,
        live: !!el.querySelector('[data-expo-live]'),
        lift: 0,
      };
    });

    this.tiles = [];
    for (let top = 0, index = 0; top < this.height; top += TILE_HEIGHT, index++) {
      this.tiles.push({
        index,
        top,
        height: Math.min(TILE_HEIGHT, this.height - top),
        map: new THREE.ExternalTexture(this.blank),
        high: null,
        low: null,
        highStale: true,
        lowStale: true,
      });
    }
  }

  /** Start watching the page for anything that would change its pixels. */
  listen() {
    this.listening = new AbortController();
    const { signal } = this.listening;
    const mark = (event: Event) => this.markDirty(event.target as Node);
    for (const type of EVENTS) {
      this.host.addEventListener(type, mark, { capture: true, passive: true, signal });
    }
    document.addEventListener(
      'selectionchange',
      () => {
        const selection = document.getSelection();
        if (selection?.anchorNode) this.markDirty(selection.anchorNode);
        if (selection?.focusNode) this.markDirty(selection.focusNode);
      },
      { signal }
    );
    this.observer = new MutationObserver((records) => {
      for (const record of records) {
        this.markDirty(record.target);
      }
    });
    this.observer.observe(this.host, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
  }

  /** Remember that this part of the page needs copying to the GPU again. */
  markDirty(target: Node) {
    const el = target instanceof Element ? target : target.parentElement;
    // The sheet itself only changes in ways that don't repaint it (inert, height).
    if (!el || el === this.host || !this.host.contains(el)) return;
    const owner = el.closest<HTMLElement>('[data-expo]');
    if (owner) {
      const drawable = this.drawables.find((d) => d.el === owner);
      // Long enough to catch the end of a CSS transition without watching every frame of it.
      if (drawable) {
        drawable.dirty = true;
        drawable.dirtyUntil = performance.now() + 500;
      }
      return;
    }
    const { y, h } = pageBox(el, this.host);
    const from = Math.floor(y / TILE_HEIGHT);
    const to = Math.floor((y + h) / TILE_HEIGHT);
    for (let i = from; i <= to; i++) {
      const tile = this.tiles[i];
      if (tile) {
        tile.highStale = true;
        tile.lowStale = true;
      }
    }
  }

  /** Copy whatever is due for this frame. Pass `all` for the first frame, which can't wait. */
  update(near: number, reach: number, all = false) {
    const now = performance.now();
    const focused = document.activeElement?.closest?.('[data-expo]');
    // Things that animate forever get every other frame; nobody reads a marquee at 120 Hz.
    const liveFrame = this.frame++ % 2 === 0;
    for (const d of this.drawables) {
      const s = near - (d.y + d.h / 2);
      const inView = (s > -d.h - 400 && s < reach) || d.el === focused;
      const due = !d.uploaded || (inView && (d.dirty || (d.live && liveFrame) || d.el === focused));
      if (d.dirty && now >= d.dirtyUntil && inView) d.dirty = false;
      if (due) this.uploadDrawable(d);
    }

    // High resolution around the reader, nearest first.
    const wanted = this.tiles
      .filter((t) => {
        const s = near - (t.top + t.height / 2);
        return s > -t.height - 700 && s < reach;
      })
      .sort(
        (a, b) =>
          Math.abs(near - 400 - a.top - a.height / 2) - Math.abs(near - 400 - b.top - b.height / 2)
      )
      .slice(0, HIGH_LIMIT);

    for (const t of this.tiles) {
      if (t.high && !wanted.includes(t)) {
        this.highFree.push(t.high);
        t.high = null;
        t.highStale = true;
      }
    }

    let highBudget = all ? 16 : 1;
    for (const t of wanted) {
      if (highBudget <= 0) break;
      if (!t.high || t.highStale) {
        this.uploadTile(t, true);
        highBudget--;
      }
    }

    // Everything else at low resolution, one a frame, so the whole roll fills in.
    let lowBudget = all ? 64 : 1;
    for (const t of this.tiles) {
      if (lowBudget <= 0) break;
      if (!t.low || (t.lowStale && !t.high)) {
        this.uploadTile(t, false);
        lowBudget--;
      }
    }

    for (const t of this.tiles) t.map.sourceTexture = t.high ?? t.low ?? this.blank;
  }

  /** Stop watching the page and give back its textures. `measure` starts it all again. */
  stop() {
    this.listening.abort();
    this.observer?.disconnect();
    this.observer = null;
    this.disposeTextures();
    this.tiles = [];
    this.drawables = [];
  }

  dispose() {
    this.stop();
    this.gl.deleteTexture(this.blank);
  }

  private disposeTextures() {
    const { gl } = this;
    for (const t of this.tiles) {
      if (t.high) gl.deleteTexture(t.high);
      if (t.low) gl.deleteTexture(t.low);
    }
    for (const d of this.drawables) if (d.texture) gl.deleteTexture(d.texture);
    for (const t of [...this.highFree, ...this.lowFree]) gl.deleteTexture(t);
    this.highFree = [];
    this.lowFree = [];
  }

  private makeTexture(width: number, height: number) {
    const { gl } = this;
    const texture = gl.createTexture()!;
    const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.anisotropy) {
      gl.texParameterf(
        gl.TEXTURE_2D,
        this.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
        this.maxAnisotropy
      );
    }
    return texture;
  }

  private copy(
    texture: WebGLTexture,
    element: HTMLElement,
    sx: number,
    sy: number,
    swidth: number,
    sheight: number,
    width: number,
    height: number
  ) {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texElementSubImage2D(gl.TEXTURE_2D, 0, 0, 0, element, {
      sx,
      sy,
      swidth,
      sheight,
      width,
      height,
    });
    gl.generateMipmap(gl.TEXTURE_2D);
    this.uploads++;
  }

  private uploadTile(tile: Tile, high: boolean) {
    const scale = high ? this.highScale : LOW_SCALE;
    const width = Math.ceil(this.width * scale);
    const height = Math.ceil(TILE_HEIGHT * scale);
    const free = high ? this.highFree : this.lowFree;
    let texture = high ? tile.high : tile.low;
    if (!texture) {
      texture = free.pop() ?? this.makeTexture(width, height);
      if (high) tile.high = texture;
      else tile.low = texture;
    }
    // The last tile is usually short: keep the scale and leave the rest of the texture unused.
    this.copy(texture, this.root, 0, tile.top, this.width, TILE_HEIGHT, width, height);
    if (high) tile.highStale = false;
    else tile.lowStale = false;
  }

  private uploadDrawable(d: Drawable) {
    const width = Math.max(1, Math.ceil(d.w * this.highScale));
    const height = Math.max(1, Math.ceil(d.h * this.highScale));
    if (!d.texture) {
      d.texture = this.makeTexture(width, height);
      d.map.sourceTexture = d.texture;
    }
    this.copy(d.texture, this.root, d.x, d.y, d.w, d.h, width, height);
    d.uploaded = true;
  }
}
