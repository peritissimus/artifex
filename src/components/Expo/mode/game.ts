// The nib: a small game played on the real page. It runs up the sheet from where you stand,
// striking out the actual words it crosses, while ink wells open in the paper ahead.

import * as THREE from 'three';
import type { Curve } from './curve';
import { lineMaterial, lineSegments, type Common } from './meshes';
import type { Sheet } from './sheet';

export type NibHost = {
  sheet: Sheet;
  curve(): Curve;
  common(): Common;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  viewport(): { width: number; height: number; pageHeight: number };
  setScroll(top: number): void;
  onRunChange(running: boolean): void;
};

type Pose = { pos: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3 };
type Word = { range: Range; x: number; y: number; w: number; h: number; hit: boolean };
type Well = { x: number; y: number; r: number; mesh: THREE.Mesh };

const NIB_DISTANCE = 560;
/** How far ahead of the nib's centre its tip reaches. Ink flows from here. */
const TIP_REACH = 118;
const MIN_SPEED = 320;
const START_SPEED = 620;
const MAX_SPEED = 1500;
const WELL_COUNT = 34;
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export class Nib {
  private state: 'idle' | 'running' | 'over' = 'idle';
  private x = 0;
  private y = 0;
  private z = 0;
  private vz = 0;
  private speed = START_SPEED;
  private steer = 0;
  private blend = 0;
  private flat = 1;
  private inked = 0;
  private startY = 0;
  private words: Word[] = [];
  private wordIndex = 0;
  private wells: Well[] = [];
  private keys = new Set<string>();
  private trail: THREE.Mesh | null = null;
  private trailPositions = new Float32Array(0);
  private trailNext = 0;
  private trailFrom: [number, number] | null = null;
  private body: THREE.Mesh | null = null;
  private bodyBase = new Float32Array(0);
  private outline: THREE.LineSegments | null = null;
  private outlineBase = new Float32Array(0);
  private group = new THREE.Group();
  private highlight: Highlight | null = null;
  private listeners: AbortController | null = null;
  private readonly hud = document.querySelector<HTMLElement>('[data-game-hud]');
  private readonly end = document.querySelector<HTMLElement>('[data-game-end]');

  private readonly sheetElement = document.querySelector<HTMLElement>('#expo-sheet');

  constructor(private readonly host: NibHost) {
    this.end?.querySelector('[data-game-again]')?.addEventListener('click', () => this.startRun());
    this.end?.querySelector('[data-game-close]')?.addEventListener('click', () => this.stop());
    this.rebuild(host.common(), host.viewport().width);
  }

  controlsScroll = () => this.state === 'running' || this.state === 'over';
  scrollAt = () => this.y - this.host.viewport().height + NIB_DISTANCE;
  cameraBlend = () => smooth(this.blend);
  overlayFade = () => 1 - smooth(this.blend);
  /** Plinths sink out of the way during a run. */
  flatten = () => this.flat;

  cameraPose(): Pose {
    const { curve } = this.host;
    const c = curve();
    // The nib stays at a fixed distance from the near line, see `scrollAt`.
    const at = c.at(NIB_DISTANCE);
    const ahead = c.at(NIB_DISTANCE + 330);
    return {
      pos: new THREE.Vector3(this.x * 0.5, at[1] + 560, -at[0] + 800),
      target: new THREE.Vector3(this.x * 0.62, ahead[1], -ahead[0]),
      up: new THREE.Vector3(0, 1, 0),
    };
  }

  rebuild(common: Common, width: number) {
    // The world clears its scene whenever it rebuilds, so join it again each time.
    this.group.clear();
    this.host.scene.add(this.group);
    const { pageHeight } = this.host.viewport();
    const ink = lineMaterial(common);
    ink.uniforms.uColor.value = new THREE.Vector3(0.78, 0.25, 0.16);
    ink.side = THREE.DoubleSide;

    // Ink trail: a ring of quads laid on the paper.
    const capacity = 2200;
    this.trailPositions = new Float32Array(capacity * 18);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    trailGeometry.setAttribute(
      'aBright',
      new THREE.BufferAttribute(new Float32Array(capacity * 6).fill(1), 1)
    );
    this.trail = new THREE.Mesh(trailGeometry, ink);
    this.trail.frustumCulled = false;
    this.trail.renderOrder = 6;
    this.trail.visible = false;
    this.group.add(this.trail);

    // The nib itself: a flat kite lying on the paper, tip first, with a slit down the middle.
    const tip = [0, -TIP_REACH, 3];
    const left = [-44, 6, 26];
    const right = [44, 6, 26];
    const tail = [0, 74, 34];
    const ridge = [0, 6, 42];
    this.bodyBase = Float32Array.from(
      [tip, left, ridge, tip, right, ridge, left, tail, ridge, right, tail, ridge].flat(2)
    );
    const bodyGeometry = new THREE.BufferGeometry();
    bodyGeometry.setAttribute('position', new THREE.BufferAttribute(this.bodyBase.slice(), 3));
    bodyGeometry.setAttribute(
      'aBright',
      new THREE.BufferAttribute(
        Float32Array.from([1, 1, 1, 0.84, 0.84, 0.84, 0.72, 0.72, 0.72, 0.6, 0.6, 0.6]),
        1
      )
    );
    const bodyMaterial = lineMaterial(common);
    bodyMaterial.uniforms.uColor.value = new THREE.Vector3(1, 0.36, 0.2);
    bodyMaterial.side = THREE.DoubleSide;
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.frustumCulled = false;
    this.body.renderOrder = 8;
    this.body.visible = false;
    this.group.add(this.body);

    this.outlineBase = Float32Array.from(
      [
        tip,
        left,
        tip,
        right,
        left,
        tail,
        right,
        tail,
        tip,
        ridge,
        left,
        ridge,
        right,
        ridge,
        ridge,
        tail,
      ].flat(2)
    );
    this.outline = lineSegments(
      this.outlineBase.slice(),
      new Float32Array(this.outlineBase.length / 3).fill(1),
      lineMaterial(common),
      9
    );
    this.outline.visible = false;
    this.group.add(this.outline);

    // Ink wells: dark discs laid into the sheet at evenly spread stations.
    this.wells = [];
    const wellMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform highp sampler2D uCurve; uniform float uRange; uniform float uNear;
        varying vec2 vUv;
        vec4 curveAt(float s) {
          float t = clamp(s, 0.0, uRange) / uRange * 4095.0;
          int i = int(floor(t));
          vec4 a = texelFetch(uCurve, ivec2(min(i, 4095), 0), 0);
          vec4 b = texelFetch(uCurve, ivec2(min(i + 1, 4095), 0), 0);
          vec4 c = mix(a, b, t - float(i));
          if (s < 0.0) c.x += s;
          return c;
        }
        void main() {
          vUv = uv;
          vec4 c = curveAt(uNear - position.y);
          gl_Position = projectionMatrix * viewMatrix * vec4(position.x, c.y + c.w * 3.0, -(c.x + c.z * 3.0), 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.92, d);
          if (a < 0.01) discard;
          vec3 ink = mix(vec3(0.02), vec3(0.78, 0.25, 0.16), smoothstep(0.86, 0.96, d));
          gl_FragColor = vec4(ink, a);
        }`,
      transparent: true,
      depthWrite: false,
      uniforms: { uCurve: common.uCurve, uRange: common.uRange, uNear: common.uNear },
    });
    const half = width / 2 - 90;
    for (let i = 0; i < WELL_COUNT; i++) {
      // A fixed, repeatable scatter: same run layout for everyone.
      const y = 500 + ((i + 0.5) / WELL_COUNT) * (pageHeight - 1200);
      const x = Math.sin(i * 12.9898) * half;
      const r = 42 + ((Math.abs(Math.sin(i * 78.233)) * 40) | 0);
      const positions = new Float32Array([
        x - r,
        y - r,
        0,
        x - r,
        y + r,
        0,
        x + r,
        y - r,
        0,
        x + r,
        y + r,
        0,
      ]);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), 2)
      );
      geometry.setIndex([0, 1, 2, 2, 1, 3]);
      const mesh = new THREE.Mesh(geometry, wellMaterial);
      mesh.frustumCulled = false;
      mesh.renderOrder = 6;
      mesh.visible = false;
      this.group.add(mesh);
      this.wells.push({ x, y, r, mesh });
    }
  }

  /** Start the nib game and steer it up the page, striking out real words. */
  startRun() {
    const { height, pageHeight } = this.host.viewport();
    this.collectWords();
    this.y = Math.min(window.scrollY + height * 0.55, pageHeight - 200);
    this.startY = this.y;
    this.x = 0;
    this.z = 0;
    this.vz = 0;
    this.speed = START_SPEED;
    this.inked = 0;
    this.trailNext = 0;
    this.trailFrom = null;
    this.trailPositions.fill(0);
    this.state = 'running';
    this.wordIndex = this.words.length - 1;
    this.setVisible(true);
    this.setHighlight([]);
    if (this.hud) this.hud.hidden = false;
    if (this.end) this.end.hidden = true;

    this.listeners?.abort();
    this.listeners = new AbortController();
    const { signal } = this.listeners;
    const handled = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'a',
      'd',
      'w',
      's',
      ' ',
      'Escape',
    ];
    window.addEventListener(
      'keydown',
      (event) => {
        if (!handled.includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Escape') {
          this.stop();
          return;
        }
        if (event.key === ' ' && this.z <= 0.01 && !event.repeat) this.vz = 620;
        this.keys.add(event.key);
      },
      { capture: true, signal }
    );
    window.addEventListener('keyup', (event) => this.keys.delete(event.key), {
      capture: true,
      signal,
    });
    window.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, this.speed - event.deltaY * 0.6));
      },
      { passive: false, signal }
    );
    (document.activeElement as HTMLElement | null)?.blur?.();
    // The page is the road for now, not something to click on.
    if (this.sheetElement) this.sheetElement.inert = true;
    this.host.onRunChange(true);
  }

  stop() {
    if (this.state === 'idle') return;
    this.state = 'idle';
    this.keys.clear();
    this.listeners?.abort();
    this.listeners = null;
    this.setVisible(false);
    this.setHighlight([]);
    if (this.hud) this.hud.hidden = true;
    if (this.end) this.end.hidden = true;
    if (this.sheetElement) this.sheetElement.inert = false;
    // Leave the page where the run got to.
    this.host.setScroll(Math.max(0, this.scrollAt()));
    this.host.onRunChange(false);
  }

  update(dt: number) {
    const running = this.state === 'running';
    const on = this.state !== 'idle';
    this.blend += ((on ? 1 : 0) - this.blend) * (1 - Math.exp(-dt * 3.2));
    this.flat += ((on ? 0 : 1) - this.flat) * (1 - Math.exp(-dt * 4));
    if (!on) return;

    if (running) {
      const left = this.keys.has('ArrowLeft') || this.keys.has('a');
      const right = this.keys.has('ArrowRight') || this.keys.has('d');
      this.steer += ((right ? 1 : 0) - (left ? 1 : 0) - this.steer) * (1 - Math.exp(-dt * 9));
      if (this.keys.has('ArrowUp') || this.keys.has('w')) this.speed += 420 * dt;
      if (this.keys.has('ArrowDown') || this.keys.has('s')) this.speed -= 620 * dt;
      this.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, this.speed));

      const half = this.host.viewport().width / 2 - 40;
      this.x = Math.max(-half, Math.min(half, this.x + this.steer * 760 * dt));
      this.y -= this.speed * dt;
      if (this.z > 0 || this.vz > 0) {
        this.vz -= 1700 * dt;
        this.z = Math.max(0, this.z + this.vz * dt);
        if (this.z === 0) this.vz = 0;
      }
      this.inkWords();
      this.checkWells();
      this.writeTrail();
      this.writeHud();
      if (this.y <= 40) this.finish(true);
    }
    this.writeBody();
  }

  private finish(reached: boolean) {
    this.state = 'over';
    this.listeners?.abort();
    this.keys.clear();
    // The run is over but its dialog is still up: Escape closes that, not the whole expo.
    this.listeners = new AbortController();
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        this.stop();
      },
      { capture: true, signal: this.listeners.signal }
    );
    const title = this.end?.querySelector('[data-game-end-title]');
    const text = this.end?.querySelector('[data-game-end-text]');
    const distance = Math.round(this.startY - this.y);
    if (title) title.textContent = reached ? 'Back at the gate' : 'In the ink';
    if (text) {
      text.textContent = reached
        ? `${this.inked} real words struck out over ${distance.toLocaleString()} px of page. They’re still selectable.`
        : `You fell in a well after ${distance.toLocaleString()} px and ${this.inked} words.`;
    }
    if (this.end) this.end.hidden = false;
    this.end?.querySelector<HTMLElement>('[data-game-again]')?.focus();
  }

  private collectWords() {
    // Every word of running text on the sheet, excluding the raised parts, indexed by page position.
    const { sheet } = this.host;
    const root = document.querySelector<HTMLElement>('#expo-sheet')!;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest('[data-expo]') || !node.nodeValue?.trim()
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    const words: Word[] = [];
    const firstSection = sheet.sections[0]?.el;
    // Rects move with the pointer lock, so measure relative to a section whose position is known.
    const base = firstSection ? firstSection.getBoundingClientRect() : { left: 0, top: 0 };
    const sectionOffset = sheet.sections[0]?.top ?? 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.nodeValue ?? '';
      const match = /\S+/g;
      let m: RegExpExecArray | null;
      while ((m = match.exec(text))) {
        const range = new Range();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rect = range.getBoundingClientRect();
        if (!rect.width) continue;
        words.push({
          range,
          x: rect.left - base.left - sheet.width / 2,
          y: rect.top - base.top + sectionOffset,
          w: rect.width,
          h: rect.height,
          hit: false,
        });
      }
    }
    words.sort((a, b) => a.y - b.y);
    this.words = words;
  }

  private inkWords() {
    if (this.z > 18) return;
    const fresh: Word[] = [];
    // Words are sorted by y: walk down from the last one still ahead of the nib.
    const tipY = this.y - TIP_REACH;
    while (this.wordIndex >= 0 && this.words[this.wordIndex].y > tipY + 40) this.wordIndex--;
    for (let i = this.wordIndex; i >= 0; i--) {
      const word = this.words[i];
      if (word.y + word.h < tipY - 40) break;
      if (word.hit) continue;
      if (
        this.x + 14 > word.x &&
        this.x - 14 < word.x + word.w &&
        tipY > word.y - 6 &&
        tipY < word.y + word.h + 6
      ) {
        word.hit = true;
        this.inked++;
        fresh.push(word);
      }
    }
    if (!fresh.length) return;
    this.setHighlight(this.words.filter((word) => word.hit).map((word) => word.range));
    for (const word of fresh) this.host.sheet.markDirty(word.range.startContainer);
  }

  private setHighlight(ranges: Range[]) {
    if (typeof Highlight === 'undefined' || !CSS.highlights) return;
    this.highlight = new Highlight(...ranges);
    CSS.highlights.set('expo-ink', this.highlight);
    if (!ranges.length) CSS.highlights.delete('expo-ink');
  }

  private checkWells() {
    if (this.z > 8) return;
    for (const well of this.wells) {
      const dx = this.x - well.x;
      const dy = this.y - well.y;
      if (dx * dx + dy * dy < well.r * well.r * 0.7) {
        this.finish(false);
        return;
      }
    }
  }

  private writeTrail() {
    if (!this.trail) return;
    // A hop lifts the nib off the paper, so the line breaks.
    if (this.z > 2) {
      this.trailFrom = null;
      return;
    }
    const tipY = this.y - TIP_REACH;
    const [x0, y0] = this.trailFrom ?? [this.x, tipY];
    const [x1, y1] = [this.x, tipY];
    this.trailFrom = [x1, y1];
    const w = 5;
    const h = 2.5;
    const capacity = this.trailPositions.length / 18;
    this.trailPositions.set(
      [x0 - w, y0, h, x1 - w, y1, h, x0 + w, y0, h, x0 + w, y0, h, x1 - w, y1, h, x1 + w, y1, h],
      this.trailNext * 18
    );
    this.trailNext = (this.trailNext + 1) % capacity;
    (this.trail.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  private writeBody() {
    if (!this.body || !this.outline) return;
    this.writeShape(this.body.geometry, this.bodyBase);
    this.writeShape(this.outline.geometry, this.outlineBase);
  }

  private writeShape(geometry: THREE.BufferGeometry, base: Float32Array) {
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    // Lean into the turn, around the tip.
    const lean = this.steer * 0.28;
    for (let i = 0; i < attribute.count; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const bz = base[i * 3 + 2];
      attribute.setXYZ(i, this.x + bx - (by + TIP_REACH) * lean, this.y + by, bz + this.z);
    }
    attribute.needsUpdate = true;
  }

  private writeHud() {
    this.setText('[data-game-words]', String(this.inked));
    this.setText('[data-game-speed]', `${Math.round(this.speed)} px/s`);
    this.setText('[data-game-left]', `${Math.max(0, Math.round(this.y)).toLocaleString()} px`);
  }

  private setText(selector: string, value: string) {
    const el = this.hud?.querySelector(selector);
    if (el && el.textContent !== value) el.textContent = value;
  }

  private setVisible(visible: boolean) {
    if (this.trail) this.trail.visible = visible;
    if (this.body) this.body.visible = visible;
    if (this.outline) this.outline.visible = visible;
    for (const well of this.wells) well.mesh.visible = visible;
  }
}
