// The world's line work, all of it in page coordinates (x, along the page, up) so the curve carries
// it with the paper. Every segment knows its anchor, so it can draw itself from there as it arrives.

import * as THREE from 'three';
import type { Common } from './meshes';
import {
  fatVertex,
  hairVertex,
  moteFragment,
  moteVertex,
  plainFragment,
  plainVertex,
  squareFragment,
  squareVertex,
  wireFragment,
} from './shaders';

export type Rgb = [number, number, number];
type Point = [number, number, number];

const CREAM: Rgb = [0.96, 0.93, 0.86];
const VERMILION: Rgb = [1, 0.36, 0.2];

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.replace('#', ''), 16) || 0;
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/** The colour a pavilion's stock of paper lights the void with: as bright as that hue will go. */
export function vividTint(stock: string, accent: string): Rgb {
  const paper = hexToRgb(stock);
  const peak = Math.max(...paper);
  // Black paper has no hue to give, so its ink speaks for it.
  if (peak < 0.2) return hexToRgb(accent);
  return mixRgb([paper[0] / peak, paper[1] / peak, paper[2] / peak], [1, 1, 1], 0.12);
}

/** A small repeatable generator: the same city for everyone, every visit. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── A bag of segments ───────────────────────────────────────────────────
export class Wires {
  readonly anchors: number[] = [];
  readonly ends: number[] = [];
  readonly tints: number[] = [];
  readonly looks: number[] = [];

  get count() {
    return this.anchors.length / 3;
  }

  add(a: Point, b: Point, tint: Rgb, bright: number, seed: number) {
    this.anchors.push(a[0], a[1], a[2]);
    this.ends.push(b[0], b[1], b[2]);
    this.tints.push(tint[0], tint[1], tint[2]);
    this.looks.push(bright, Math.min(1, seed));
  }

  /** Join points into a line, drawn in order between two seeds. */
  path(points: Point[], tint: Rgb, bright: number, seedFrom = 0, seedTo = seedFrom) {
    for (let i = 0; i < points.length - 1; i++) {
      const t = i / Math.max(1, points.length - 2);
      this.add(points[i], points[i + 1], tint, bright, seedFrom + (seedTo - seedFrom) * t);
    }
  }
}

const quiet = (object: THREE.Object3D, order: number) => {
  object.frustumCulled = false;
  object.renderOrder = order;
};

const wireUniforms = (common: Common, opacity: number) => ({
  ...common,
  uOpacity: { value: opacity },
  uWidth: { value: 1 },
  uHead: { value: 2 },
});

/** Thin lines, as many as you like. */
export function hairlines(wires: Wires, common: Common, opacity = 1, order = 5) {
  const n = wires.count;
  const position = new Float32Array(n * 6);
  const anchor = new Float32Array(n * 6);
  const tint = new Float32Array(n * 6);
  const look = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = wires.anchors.slice(i * 3, i * 3 + 3);
    position.set(a, i * 6);
    position.set(wires.ends.slice(i * 3, i * 3 + 3), i * 6 + 3);
    anchor.set(a, i * 6);
    anchor.set(a, i * 6 + 3);
    const t = wires.tints.slice(i * 3, i * 3 + 3);
    tint.set(t, i * 6);
    tint.set(t, i * 6 + 3);
    const l = wires.looks.slice(i * 2, i * 2 + 2);
    look.set(l, i * 4);
    look.set(l, i * 4 + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aAnchor', new THREE.BufferAttribute(anchor, 3));
  geometry.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));
  geometry.setAttribute('aLook', new THREE.BufferAttribute(look, 2));
  const material = new THREE.ShaderMaterial({
    vertexShader: hairVertex,
    fragmentShader: wireFragment,
    transparent: true,
    depthWrite: false,
    uniforms: wireUniforms(common, opacity),
  });
  const lines = new THREE.LineSegments(geometry, material);
  quiet(lines, order);
  return { object: lines, material };
}

/** Lines with a real width in pixels, for the things the eye should follow. */
export function fatlines(wires: Wires, common: Common, width: number, opacity = 1, order = 6) {
  const n = wires.count;
  const position = new Float32Array(n * 12);
  const anchor = new Float32Array(n * 12);
  const tint = new Float32Array(n * 12);
  const look = new Float32Array(n * 8);
  const corner = new Float32Array(n * 8);
  const indices: number[] = [];
  const corners = [0, -1, 0, 1, 1, -1, 1, 1];
  for (let i = 0; i < n; i++) {
    const a = wires.anchors.slice(i * 3, i * 3 + 3);
    const b = wires.ends.slice(i * 3, i * 3 + 3);
    const t = wires.tints.slice(i * 3, i * 3 + 3);
    const l = wires.looks.slice(i * 2, i * 2 + 2);
    for (let k = 0; k < 4; k++) {
      position.set(b, (i * 4 + k) * 3);
      anchor.set(a, (i * 4 + k) * 3);
      tint.set(t, (i * 4 + k) * 3);
      look.set(l, (i * 4 + k) * 2);
    }
    corner.set(corners, i * 8);
    const v = i * 4;
    indices.push(v, v + 1, v + 2, v + 2, v + 1, v + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aAnchor', new THREE.BufferAttribute(anchor, 3));
  geometry.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));
  geometry.setAttribute('aLook', new THREE.BufferAttribute(look, 2));
  geometry.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    vertexShader: fatVertex,
    fragmentShader: wireFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: wireUniforms(common, opacity),
  });
  material.uniforms.uWidth.value = width;
  const mesh = new THREE.Mesh(geometry, material);
  quiet(mesh, order);
  return { object: mesh, material };
}

// ── The city ────────────────────────────────────────────────────────────
type Clearing = { x: number; y: number; r: number };

/** A drafted skyline down both flanks, low by the road and tall further out, like a canyon. */
export function cityWires(
  sheetWidth: number,
  pageHeight: number,
  tintAt: (y: number) => Rgb,
  clearings: Clearing[]
) {
  const wires = new Wires();
  const LOT = 280;
  const ROWS = 13;
  const first = sheetWidth / 2 + 430;

  for (const side of [-1, 1]) {
    for (let row = 0; row < ROWS; row++) {
      const x = side * (first + row * LOT);
      for (let y = -2800; y < pageHeight + 3200; y += LOT) {
        const rng = random(row * 92821 + (side + 1) * 7919 + (y + 4000) * 31);
        const kind = rng();
        const px = x + (rng() - 0.5) * LOT * 0.22;
        const py = y + (rng() - 0.5) * LOT * 0.22;
        if (clearings.some((c) => Math.hypot(c.x - px, c.y - py) < c.r)) continue;

        const tint = mixRgb(tintAt(py), CREAM, 0.08 + rng() * 0.34);
        const bright = (0.22 + rng() * 0.4) * (1 - (row / ROWS) * 0.5);
        const seed = rng();
        const w = LOT * (0.42 + rng() * 0.36);
        const d = LOT * (0.42 + rng() * 0.36);
        const tall = (70 + 52 * row ** 1.25) * (0.45 + rng() * 0.95);

        const emit = (a: Point, b: Point, order = 0) =>
          wires.add(a, b, tint, bright, seed * 0.72 + order * 0.07);

        /** A box: walls rise first, then the roof closes. */
        const block = (cx: number, cy: number, z: number, bw: number, bd: number, h: number) => {
          const x0 = cx - bw / 2;
          const x1 = cx + bw / 2;
          const y0 = cy - bd / 2;
          const y1 = cy + bd / 2;
          const corners: [number, number][] = [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
          ];
          corners.forEach(([cornerX, cornerY], i) => {
            emit([cornerX, cornerY, z], [cornerX, cornerY, z + h], 0);
            const [nextX, nextY] = corners[(i + 1) % 4];
            emit([cornerX, cornerY, z + h], [nextX, nextY, z + h], 1 + i * 0.5);
          });
        };
        /** Horizontal bands up a block. */
        const floors = (cx: number, cy: number, z: number, bw: number, bd: number, h: number) => {
          const count = Math.min(5, Math.floor(h / 120));
          for (let f = 1; f <= count; f++) {
            const fz = z + (h * f) / (count + 1);
            const x0 = cx - bw / 2;
            const x1 = cx + bw / 2;
            const y0 = cy - bd / 2;
            const y1 = cy + bd / 2;
            emit([x0, y1, fz], [x1, y1, fz], 2 + f * 0.3);
            emit([x1, y1, fz], [x1, y0, fz], 2 + f * 0.3);
          }
        };

        if (kind < 0.14) {
          // An empty plot, staked out for later.
          emit([px - w / 2, py, 1], [px + w / 2, py, 1]);
          emit([px, py - d / 2, 1], [px, py + d / 2, 1]);
        } else if (kind < 0.56) {
          block(px, py, 0, w, d, tall);
          floors(px, py, 0, w, d, tall);
        } else if (kind < 0.76) {
          // A setback tower with a mast.
          let z = 0;
          let bw = w;
          let bd = d;
          for (let tier = 0; tier < 3; tier++) {
            const h = (tall * (1.1 - tier * 0.25)) / 2.2;
            block(px, py, z, bw, bd, h);
            z += h;
            bw *= 0.68;
            bd *= 0.68;
          }
          emit([px, py, z], [px, py, z + 60 + tall * 0.2], 4);
        } else if (kind < 0.86) {
          // A gable, for scale.
          const h = Math.min(tall, 130);
          block(px, py, 0, w, d, h);
          const ridge = h + w * 0.34;
          emit([px - w / 2, py - d / 2, h], [px, py - d / 2, ridge], 3);
          emit([px, py - d / 2, ridge], [px + w / 2, py - d / 2, h], 3.5);
          emit([px - w / 2, py + d / 2, h], [px, py + d / 2, ridge], 3);
          emit([px, py + d / 2, ridge], [px + w / 2, py + d / 2, h], 3.5);
          emit([px, py - d / 2, ridge], [px, py + d / 2, ridge], 4);
        } else if (kind < 0.94) {
          // A gas holder.
          const r = Math.min(w, d) / 2;
          const h = Math.min(tall, 300);
          const sides = 10;
          for (let i = 0; i < sides; i++) {
            const a0 = (i / sides) * Math.PI * 2;
            const a1 = ((i + 1) / sides) * Math.PI * 2;
            const ax = px + Math.cos(a0) * r;
            const ay = py + Math.sin(a0) * r;
            const bx = px + Math.cos(a1) * r;
            const by = py + Math.sin(a1) * r;
            emit([ax, ay, 0], [ax, ay, h], 0);
            emit([ax, ay, h], [bx, by, h], 1.5);
            emit([ax, ay, h * 0.5], [bx, by, h * 0.5], 2.5);
          }
        } else {
          // A lattice pylon, the tallest thing on the block.
          const h = tall * 1.4 + 120;
          const r = Math.min(w, d) * 0.42;
          const levels = 6;
          const legs: [number, number][] = [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ];
          for (let l = 0; l < levels; l++) {
            const t0 = l / levels;
            const t1 = (l + 1) / levels;
            const r0 = r * (1 - t0 * 0.84);
            const r1 = r * (1 - t1 * 0.84);
            legs.forEach(([lx, ly], i) => {
              const [nx, ny] = legs[(i + 1) % 4];
              emit(
                [px + lx * r0, py + ly * r0, h * t0],
                [px + lx * r1, py + ly * r1, h * t1],
                l * 0.5
              );
              emit(
                [px + lx * r0, py + ly * r0, h * t0],
                [px + nx * r1, py + ny * r1, h * t1],
                l * 0.5 + 0.3
              );
            });
          }
        }
      }
    }
  }
  return wires;
}

// ── The boulevard: gates, cables and hangers ────────────────────────────
export type Station = { top: number; height: number; tint: Rgb };

export function boulevardWires(sheetWidth: number, pageHeight: number, stations: Station[]) {
  const fat = new Wires();
  const hair = new Wires();
  const span = sheetWidth / 2 + 190;
  const CROWN = 1560;
  const TOWER = 820;

  stations.forEach((station, index) => {
    const y = station.top;
    const tint = mixRgb(station.tint, CREAM, 0.2);

    // The gate: a trussed arch big enough to walk the whole sheet through.
    const samples = 56;
    const arch = (inset: number, drop: number, offset: number): Point[] =>
      Array.from({ length: samples + 1 }, (_, i) => {
        const t = i / samples;
        const u = 2 * t - 1;
        return [
          (span - inset) * u,
          y + offset,
          Math.max(0, (CROWN - drop) * (1 - u * u) ** 0.62),
        ] as Point;
      });
    const outer = arch(0, 0, 0);
    const inner = arch(62, 96, 0);
    const back = arch(0, 0, 44);
    // Draw from both feet up to the crown, at once.
    const halfway = samples / 2;
    for (let i = 0; i < samples; i++) {
      const fromFoot = (i < halfway ? i : samples - 1 - i) / halfway;
      const seed = 0.05 + fromFoot * 0.45;
      const ascending = i < halfway;
      const [a, b] = ascending ? [outer[i], outer[i + 1]] : [outer[i + 1], outer[i]];
      fat.add(a, b, tint, 0.95, seed);
      const [c, e] = ascending ? [inner[i], inner[i + 1]] : [inner[i + 1], inner[i]];
      hair.add(c, e, tint, 0.8, seed);
      const [f, g] = ascending ? [back[i], back[i + 1]] : [back[i + 1], back[i]];
      hair.add(f, g, tint, 0.55, seed);
      // The web of the truss, and ties across to its other face.
      hair.add(i % 2 ? outer[i] : inner[i], i % 2 ? inner[i + 1] : outer[i + 1], tint, 0.6, seed);
      if (i % 3 === 0) hair.add(outer[i], back[i], tint, 0.5, seed);
    }

    // Towers carry the cables either side of the road.
    for (const side of [-1, 1]) {
      const x = side * span;
      const width = 46;
      for (const leg of [-1, 1]) {
        hair.add([x + leg * width, y, 0], [x, y, TOWER], tint, 0.75, 0.1);
      }
      const levels = 7;
      for (let l = 0; l < levels; l++) {
        const t0 = l / levels;
        const t1 = (l + 1) / levels;
        const w0 = width * (1 - t0);
        const w1 = width * (1 - t1);
        hair.add([x - w0, y, TOWER * t0], [x + w1, y, TOWER * t1], tint, 0.5, 0.15 + t0 * 0.2);
        hair.add([x + w0, y, TOWER * t0], [x - w1, y, TOWER * t1], tint, 0.5, 0.15 + t0 * 0.2);
      }

      // A cable sagging to the next gate, with hangers dropping to the road.
      const next = stations[index + 1]?.top ?? pageHeight;
      const length = next - y;
      if (length <= 0) continue;
      const cable: Point[] = [];
      for (let along = 0; along <= length; along += 60) {
        const u = along / length;
        cable.push([x, y + along, TOWER - 660 * 4 * u * (1 - u)]);
      }
      cable.push([x, next, TOWER]);
      fat.path(cable, mixRgb(tint, CREAM, 0.4), 0.72, 0.28, 0.5);
      for (let along = 120; along < length; along += 120) {
        const u = along / length;
        const h = TOWER - 660 * 4 * u * (1 - u);
        hair.add([x, y + along, h], [x, y + along, 0], tint, 0.34, 0.42);
        // Beams out to the edge of the sheet, every third hanger.
        if (Math.round(along / 120) % 3 === 0) {
          hair.add([x, y + along, 2], [side * (sheetWidth / 2), y + along, 2], tint, 0.26, 0.5);
        }
      }
      // A low rail along the paper.
      const edge = side * (sheetWidth / 2 + 14);
      const rail: Point[] = [];
      for (let along = 0; along <= length; along += 60) rail.push([edge, y + along, 44]);
      hair.path(rail, tint, 0.42, 0.34);
      for (let along = 0; along < length; along += 120) {
        hair.add([edge, y + along, 0], [edge, y + along, 44], tint, 0.42, 0.3);
      }
    }
  });
  return { fat, hair };
}

/** A display case of bare edges around each exhibit. */
export function vitrineWires(
  plinths: { x: number; y: number; w: number; h: number; tint: Rgb }[],
  height = 128
) {
  const wires = new Wires();
  for (const p of plinths) {
    const x0 = p.x - 10;
    const x1 = p.x + p.w + 10;
    const y0 = p.y - 10;
    const y1 = p.y + p.h + 10;
    const tint = mixRgb(p.tint, CREAM, 0.5);
    const corners: [number, number][] = [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    corners.forEach(([cx, cy], i) => {
      wires.add([cx, cy, 0], [cx, cy, height], tint, 0.42, 0.3);
      const [nx, ny] = corners[(i + 1) % 4];
      wires.add([cx, cy, height], [nx, ny, height], tint, 0.2, 0.42 + i * 0.03);
    });
  }
  return wires;
}

// ── The line ────────────────────────────────────────────────────────────
function spline(points: Point[], step: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const n = Math.max(
      2,
      Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]) / step)
    );
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (c: 0 | 1 | 2) =>
        0.5 *
        (2 * p1[c] +
          (p2[c] - p0[c]) * t +
          (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 +
          (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3);
      out.push([at(0), at(1), Math.max(2, at(2))]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * One unbroken pen line through the whole expo: over the sheet at each section, round the pavilion
 * on that side, on to the next, and down at last onto the artist's seal. It's the same line the
 * studio page starts with, and it draws itself only as far as you've come.
 */
export class Thread {
  readonly wires = new Wires();
  private readonly points: Point[];
  private readonly lengths: number[] = [];
  private readonly furthest: number[] = [];

  constructor(sheetWidth: number, stations: Station[], end: { x: number; y: number }) {
    const edge = sheetWidth / 2 + 250;
    const guide: Point[] = [[-edge, -360, 50]];
    stations.forEach((station, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      // Across the sheet, low enough to pass over the margin and not the exhibit before it.
      guide.push([-side * edge, station.top - 90, 110]);
      guide.push([0, station.top + 34, 96]);
      guide.push([side * edge, station.top + 150, 110]);
      if (index === stations.length - 1) return;
      // Round the pavilion, climbing as it goes.
      const centreX = side * (sheetWidth / 2 + 500);
      const centreY = station.top + station.height / 2;
      const radius = Math.min(540, station.height * 0.3);
      const STEPS = 14;
      for (let k = 0; k <= STEPS; k++) {
        const t = k / STEPS;
        // Starts on the side nearest the sheet, already heading down the page.
        const a = side > 0 ? Math.PI - t * Math.PI * 2.5 : t * Math.PI * 2.5;
        guide.push([
          centreX + Math.cos(a) * radius,
          centreY + Math.sin(a) * radius * 0.9,
          130 + 470 * Math.sin(Math.PI * t),
        ]);
      }
      guide.push([side * edge, station.top + station.height - 220, 150]);
    });
    guide.push([end.x, end.y - 200, 90]);
    guide.push([end.x, end.y, 4]);

    this.points = spline(guide, 26);
    let total = 0;
    let peak = -Infinity;
    this.points.forEach((point, i) => {
      if (i > 0) {
        const p = this.points[i - 1];
        total += Math.hypot(point[0] - p[0], point[1] - p[1], point[2] - p[2]);
      }
      this.lengths.push(total);
      peak = Math.max(peak, point[1]);
      this.furthest.push(peak);
    });
    for (let i = 0; i < this.points.length - 1; i++) {
      this.wires.add(this.points[i], this.points[i + 1], VERMILION, 1, this.lengths[i] / total);
    }
  }

  /** How far the pen has got by the time the page has reached `pageY`. */
  headAt(pageY: number) {
    let lo = 0;
    let hi = this.furthest.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.furthest[mid] < pageY) lo = mid + 1;
      else hi = mid;
    }
    const total = this.lengths[this.lengths.length - 1];
    return { point: this.points[lo], length: this.lengths[lo], fraction: this.lengths[lo] / total };
  }
}

// ── Motes: dust in the air that streaks when you move ───────────────────
export function motes(sheetWidth: number, pageHeight: number, common: Common) {
  const count = Math.round(pageHeight / 2.6);
  const position = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  const phase = new Float32Array(count * 2);
  const rng = random(149);
  const reach = sheetWidth / 2 + 3200;
  for (let i = 0; i < count; i++) {
    let x = (rng() * 2 - 1) * reach;
    // Only a few drift over the sheet, where they'd sit on top of the words.
    if (Math.abs(x) < sheetWidth / 2 && rng() > 0.18) {
      x = Math.sign(x || 1) * (sheetWidth / 2 + rng() * (reach - sheetWidth / 2));
    }
    const y = -1800 + rng() * (pageHeight + 3600);
    const z = 40 + rng() ** 1.4 * 1500;
    const p = rng() * Math.PI * 2;
    position.set([x, y, z, x, y, z], i * 6);
    end[i * 2 + 1] = 1;
    phase[i * 2] = p;
    phase[i * 2 + 1] = p;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: moteVertex,
    fragmentShader: moteFragment,
    transparent: true,
    depthWrite: false,
    uniforms: { ...common },
  });
  const lines = new THREE.LineSegments(geometry, material);
  quiet(lines, 7);
  return lines;
}

// ── The T-square: two lines through the cursor, across paper and ground ─
export function tSquare(common: Common) {
  const positions: number[] = [];
  const REACH = 2600;
  for (let x = -REACH; x < REACH; x += 80) positions.push(x, 0, 0, x + 80, 0, 0);
  for (let y = -REACH; y < 1200; y += 40) positions.push(0, y, 0, 0, y + 40, 0);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(positions), 3));
  const material = new THREE.ShaderMaterial({
    vertexShader: squareVertex,
    fragmentShader: squareFragment,
    transparent: true,
    depthWrite: false,
    // Invert whatever is underneath, so it reads on every colour of paper.
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneMinusDstColorFactor,
    blendDst: THREE.OneMinusSrcColorFactor,
    blendEquation: THREE.AddEquation,
    uniforms: { ...common },
  });
  const lines = new THREE.LineSegments(geometry, material);
  quiet(lines, 8);
  return lines;
}

// ── The working drawing behind the finale ───────────────────────────────
const CIRCLE_STEPS = 96;
const AXIS_DIVISIONS = 40;

/**
 * The geometry of the curve, drawn the way a drafter would construct it: the osculating circle at
 * each pavilion's boundary, its radius, and ruled axes. Real values, rebuilt as the spiral opens.
 */
export class Construction {
  readonly object: THREE.LineSegments;
  readonly material: THREE.ShaderMaterial;
  private readonly positions: Float32Array;
  private readonly attribute: THREE.BufferAttribute;

  constructor(
    private readonly circles: number,
    private readonly x: number
  ) {
    // A radius with each circle, then the two axes and a tick on each per division.
    const count = circles * (CIRCLE_STEPS + 1) + 2 + (AXIS_DIVISIONS + 1) * 2;
    this.positions = new Float32Array(count * 6);
    const geometry = new THREE.BufferGeometry();
    this.attribute = new THREE.BufferAttribute(this.positions, 3);
    geometry.setAttribute('position', this.attribute);
    this.material = new THREE.ShaderMaterial({
      vertexShader: plainVertex,
      fragmentShader: plainFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uOpacity: { value: 0 } },
    });
    this.object = new THREE.LineSegments(geometry, this.material);
    quiet(this.object, 4);
    this.object.visible = false;
  }

  /** `at` gives the curve's run, rise and normal at a distance; `tops` are the page's boundaries. */
  update(
    at: (s: number) => [number, number, number, number],
    start: number,
    scale: number,
    distances: number[]
  ) {
    const { positions, x } = this;
    let n = 0;
    const line = (run0: number, rise0: number, run1: number, rise1: number) => {
      positions.set([x, rise0, -run0, x, rise1, -run1], n);
      n += 6;
    };
    let drawn = 0;
    for (const s of distances) {
      if (drawn >= this.circles) break;
      const u = s - start;
      if (u < 900) continue;
      const point = at(s);
      const radius = (scale * scale) / u;
      const centreRun = point[0] + point[2] * radius;
      const centreRise = point[1] + point[3] * radius;
      for (let i = 0; i < CIRCLE_STEPS; i++) {
        const a0 = (i / CIRCLE_STEPS) * Math.PI * 2;
        const a1 = ((i + 1) / CIRCLE_STEPS) * Math.PI * 2;
        line(
          centreRun + Math.cos(a0) * radius,
          centreRise + Math.sin(a0) * radius,
          centreRun + Math.cos(a1) * radius,
          centreRise + Math.sin(a1) * radius
        );
      }
      line(point[0], point[1], centreRun, centreRise);
      drawn++;
    }
    // Ruled axes under and beside it.
    const left = start - scale * 0.4;
    const right = start + scale * 3;
    line(left, -60, right, -60);
    line(left, -60, left, scale * 2.1);
    const tick = (right - left) / AXIS_DIVISIONS;
    for (let i = 0; i <= AXIS_DIVISIONS; i++) {
      const size = i % 5 === 0 ? 70 : 30;
      line(left + tick * i, -60, left + tick * i, -60 - size);
      line(left, -60 + tick * i, left - size, -60 + tick * i);
    }
    positions.fill(0, n);
    this.attribute.needsUpdate = true;
  }
}
