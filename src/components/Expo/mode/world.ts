// Expo Mode. The page stays exactly where it is in the DOM: a shadow root slots it into a sticky
// canvas, WebGL draws it onto the curve, and the DOM is nudged under the cursor so it stays usable.

import * as THREE from 'three';
import { Curve, CURVE_SAMPLES } from './curve';
import {
  extrudedHeading,
  groundMesh,
  lineMaterial,
  lineSegments,
  plinthMesh,
  plinthShadow,
  rgb,
  sheetEdges,
  tileMesh,
  type Common,
} from './meshes';
import { Overlay } from './overlay';
import { pavilionSegments } from './pavilions';
import { ORIGIN, Sheet, type Drawable } from './sheet';
import { Nib, type NibHost } from './game';

const FOV = 38;
const VOID = '#0b0a08';
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

type Pick = { x: number; y: number; s: number; plinth: Drawable | null };
type Pose = { pos: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3 };

export type World = {
  to(target: 0 | 1): Promise<void>;
  amount(): number;
  startRun(): void;
  running(): boolean;
  dispose(): void;
};

export function createWorld(
  host: HTMLElement,
  onFail: () => void,
  onRunChange: (running: boolean) => void
): World {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── The canvas and its one drawable root ──────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.setAttribute('content', 'drawable');
  canvas.style.cssText = `display:block;position:sticky;top:0;width:100%;height:100vh;overflow:visible;background:${VOID}`;
  const root = document.createElement('div');
  root.setAttribute('drawable', '');
  root.style.cssText = 'position:relative;width:100%';
  const slot = document.createElement('slot');
  slot.style.cssText = 'display:block;position:relative';
  root.append(slot);
  canvas.append(root);

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: true,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) throw new Error('Expo Mode needs WebGL2.');

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(new THREE.Color().setRGB(0.043, 0.039, 0.031), 1);
  renderer.sortObjects = true;

  const overlay = new Overlay();
  const sheet = new Sheet(gl, host, root);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 20, 90000);

  let curve: Curve | null = null;
  let baseScale = 1;
  let ground: THREE.Mesh | null = null;
  let common: Common | null = null;
  let curveTexture: THREE.DataTexture | null = null;
  const plinths: { d: Drawable; mesh: THREE.Mesh; shadow: THREE.Mesh; maxLift: number }[] = [];
  const headings: {
    d: Drawable;
    depth: { value: number };
    offset: { value: THREE.Vector2 };
    maxDepth: number;
  }[] = [];

  // ── State ─────────────────────────────────────────────────────────────
  let vw = 0;
  let vh = 0;
  let pageHeight = 0;
  let tail = 0;
  let pixelRatio = 1;
  let smoothedScroll = window.scrollY;
  let amount = 0;
  let amountFrom = 0;
  let amountTo = 0;
  let amountStart = 0;
  let amountLength = 1;
  let finish: (() => void) | null = null;
  let builtBend = -1;
  let builtScale = -1;
  let attached = false;
  let alive = true;
  let firstFrame = true;
  let lastTime = performance.now();
  let pointer: { x: number; y: number } | null = null;
  let keyboardDriven = false;
  let parallaxX = 0;
  let parallaxY = 0;
  let stepUp = 0;
  let stepUpTarget: Drawable | null = null;
  let activeSection = -1;
  let frames = 0;
  let uploadsAtLastReadout = 0;
  let lastReadout = 0;
  let cursorPick: Pick | null = null;
  let locked: [number, number] | null = null;
  let firstPaintTimer = 0;
  let nib: Nib | null = null;
  let listeners = new AbortController();

  const rail = document.querySelector<HTMLElement>('.expo-rail');
  const railLinks = new Map(
    [...document.querySelectorAll<HTMLAnchorElement>('[data-rail]')].map((a) => [
      a.dataset.rail!,
      a,
    ])
  );
  const tele = (name: string) => document.querySelector<HTMLElement>(`[data-tele="${name}"]`);
  const setTele = (name: string, value: string) => {
    const el = tele(name);
    if (el && el.textContent !== value) el.textContent = value;
  };

  // ── Building the world from the measured page ─────────────────────────
  function clearScene() {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose?.();
    });
    scene.clear();
    plinths.length = 0;
    headings.length = 0;
    curveTexture?.dispose();
  }

  function build() {
    clearScene();
    vw = host.clientWidth;
    vh = window.innerHeight;
    // Sharp, but not at any price: past about 5 megapixels nobody can see it and everyone can feel it.
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5_000_000 / (vw * vh)));
    sheet.measure(pixelRatio);
    pageHeight = sheet.height;
    tail = Math.round(vh * 1.8);
    host.style.height = `${pageHeight + tail}px`;

    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(vw * pixelRatio), Math.round(vh * pixelRatio), false);
    overlay.resize(vw, vh, pixelRatio);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();

    const range = pageHeight + tail + vh * 2 + 3000;
    baseScale = Math.max(760, vh * 1.02);
    curve = new Curve(range, vh * 0.86, baseScale);
    curveTexture = new THREE.DataTexture(
      curve.data,
      CURVE_SAMPLES,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    curveTexture.minFilter = THREE.NearestFilter;
    curveTexture.magFilter = THREE.NearestFilter;
    curveTexture.needsUpdate = true;
    builtBend = -1;
    builtScale = -1;

    common = {
      uCurve: { value: curveTexture },
      uRange: { value: range },
      uNear: { value: 0 },
      uAmount: { value: 0 },
      uVoid: { value: rgb(VOID) },
      uGround: { value: 1 },
      uFar: { value: 1 },
      uRolled: { value: 1 },
    };

    ground = groundMesh(pageHeight, common);
    scene.add(ground);
    for (const tile of sheet.tiles) scene.add(tileMesh(tile, vw, common));
    scene.add(sheetEdges(vw, pageHeight, common));

    for (const d of sheet.drawables) {
      // Meshes are centred on the sheet; the DOM measures from its left edge.
      const centred = { ...d, x: d.x - vw / 2 };
      const style = getComputedStyle(sheet.sections[d.section]?.el ?? host);
      const wall = rgb(style.getPropertyValue('--extrude').trim() || '#444444');
      if (d.kind === 'plinth') {
        const mesh = plinthMesh(centred, wall, common);
        const shadow = plinthShadow(centred, common);
        scene.add(shadow, mesh);
        plinths.push({ d, mesh, shadow, maxLift: Math.min(84, d.w * 0.075) });
      } else {
        const { group, depth, offset } = extrudedHeading(centred, wall, common);
        scene.add(group);
        headings.push({ d, depth, offset, maxDepth: Math.min(96, d.h * 0.36) });
      }
    }

    const sites = sheet.sections.map((section) => ({
      id: section.id.replace('p-', ''),
      y: section.top + section.height * 0.5,
    }));
    const { positions, brightness } = pavilionSegments(sites, vw);
    scene.add(lineSegments(positions, brightness, lineMaterial(common, 520)));
    nib?.rebuild(common, vw);

    firstFrame = true;
    locked = null;
  }

  // ── Camera ────────────────────────────────────────────────────────────
  const flatDistance = () => vh / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const flatPose = (): Pose => {
    const d = flatDistance();
    return {
      pos: new THREE.Vector3(0, d, -vh / 2),
      target: new THREE.Vector3(0, 0, -vh / 2),
      up: new THREE.Vector3(0, 0, -1),
    };
  };
  const expoPose = (): Pose => {
    const d = flatDistance() * 1.62;
    const pitch = THREE.MathUtils.degToRad(35);
    const target = new THREE.Vector3(parallaxX * 40, vh * 0.08 + parallaxY * -10, -vh * 0.82);
    return {
      pos: new THREE.Vector3(
        parallaxX * 130,
        Math.sin(pitch) * d + parallaxY * 34,
        target.z + Math.cos(pitch) * d
      ),
      target,
      up: new THREE.Vector3(0, 1, 0),
    };
  };
  // At the very end of the roll the spiral opens up and the camera walks out to see all of it.
  const finaleScale = () => pageHeight * 0.26;
  const finalePose = (): Pose => {
    const a = finaleScale();
    const start = curve!.start;
    const target = new THREE.Vector3(0, a * 0.52, -(start + a * 0.92));
    const r = a * 3.3;
    const angle = THREE.MathUtils.degToRad(63);
    return {
      pos: new THREE.Vector3(
        Math.sin(angle) * r,
        target.y + r * 0.24,
        target.z + Math.cos(angle) * r
      ),
      target,
      up: new THREE.Vector3(0, 1, 0),
    };
  };
  // Stepping up to an exhibit: look straight down its surface, close enough to read it at full size.
  const stepUpPose = (d: Drawable, near: number): Pose => {
    const c = curve!;
    const s = near - (d.y + d.h / 2);
    const at = c.at(s);
    // Close enough to fill the screen, but no closer than the texture stays sharp.
    const fit =
      Math.max(d.h * 1.14, (d.w * 1.08) / camera.aspect) /
      2 /
      Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const distance = Math.max(fit, flatDistance() / Math.min(pixelRatio, 2));
    const lift = d.lift;
    const normal = new THREE.Vector3(0, at[3], -at[2]);
    const centre = new THREE.Vector3(
      d.x + d.w / 2 - vw / 2,
      at[1] + at[3] * lift,
      -(at[0] + at[2] * lift)
    );
    return {
      pos: centre.clone().addScaledVector(normal, distance),
      target: centre,
      up: new THREE.Vector3(0, at[2] * -1, -at[3]).normalize().multiplyScalar(1),
    };
  };
  const mix = (a: Pose, b: Pose, t: number): Pose => ({
    pos: a.pos.clone().lerp(b.pos, t),
    target: a.target.clone().lerp(b.target, t),
    up: a.up.clone().lerp(b.up, t),
  });

  function placeCamera(near: number, finale: number) {
    let pose = expoPose();
    if (finale > 0) pose = mix(pose, finalePose(), easeInOut(finale));
    if (stepUp > 0.001 && stepUpTarget)
      pose = mix(pose, stepUpPose(stepUpTarget, near), easeInOut(stepUp));
    if (nib) {
      const blend = nib.cameraBlend();
      if (blend > 0.001) pose = mix(pose, nib.cameraPose(), blend);
    }
    pose = mix(flatPose(), pose, easeInOut(amount));
    camera.position.copy(pose.pos);
    camera.up.copy(pose.up).normalize();
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
  }

  // ── Page point under the cursor ───────────────────────────────────────
  const rayOrigin = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  const projected = new THREE.Vector3();

  /** Find the page point under the mouse by casting a ray at the curved sheet. */
  function pick(cx: number, cy: number, near: number): Pick | null {
    const c = curve;
    if (!c) return null;
    rayOrigin.copy(camera.position);
    rayDir
      .set((cx / vw) * 2 - 1, -(cy / vh) * 2 + 1, 0.5)
      .unproject(camera)
      .sub(rayOrigin)
      .normalize();
    const ox = -rayOrigin.z;
    const oy = rayOrigin.y;
    const dx = -rayDir.z;
    const dy = rayDir.y;
    const denominator = dx * dx + dy * dy;
    if (denominator < 1e-9) return null;

    let bestT = Infinity;
    let bestS = 0;
    let bestPlinth: Drawable | null = null;

    // Behind the near line the paper is flat, so a plane will do.
    if (dy < 0) {
      const t = -oy / dy;
      const run = ox + t * dx;
      if (t > 0 && run <= 0) {
        bestT = t;
        bestS = run;
      }
    }

    const walk = (
      from: number,
      to: number,
      stride: number,
      lift: number,
      plinth: Drawable | null
    ) => {
      const data = c.data;
      let previous = 0;
      for (let i = from; i <= to; i += stride) {
        const run = data[i * 4] + data[i * 4 + 2] * lift;
        const rise = data[i * 4 + 1] + data[i * 4 + 3] * lift;
        const side = (run - ox) * dy - (rise - oy) * dx;
        if (i > from && side * previous <= 0 && side !== previous) {
          const j = i - stride;
          const f = previous / (previous - side);
          const hitRun =
            data[j * 4] + data[j * 4 + 2] * lift + (run - data[j * 4] - data[j * 4 + 2] * lift) * f;
          const hitRise =
            data[j * 4 + 1] +
            data[j * 4 + 3] * lift +
            (rise - data[j * 4 + 1] - data[j * 4 + 3] * lift) * f;
          const t = ((hitRun - ox) * dx + (hitRise - oy) * dy) / denominator;
          if (t > 0 && t < bestT) {
            const s = (j + f * stride) * c.step;
            if (plinth) {
              const x = rayOrigin.x + rayDir.x * t + vw / 2;
              const y = near - s;
              if (
                x < plinth.x ||
                x > plinth.x + plinth.w ||
                y < plinth.y ||
                y > plinth.y + plinth.h
              ) {
                previous = side;
                continue;
              }
            }
            bestT = t;
            bestS = s;
            bestPlinth = plinth;
          }
        }
        previous = side;
      }
    };

    walk(0, CURVE_SAMPLES - 1, 2, 0, null);
    for (const { d } of plinths) {
      if (d.lift < 0.5) continue;
      const a = Math.floor(Math.max(0, near - d.y - d.h) / c.step);
      const b = Math.ceil(Math.max(0, near - d.y) / c.step);
      if (b <= 0 || a >= CURVE_SAMPLES) continue;
      walk(Math.max(0, a - 1), Math.min(CURVE_SAMPLES - 1, b + 1), 1, d.lift, d);
    }

    if (!Number.isFinite(bestT)) return null;
    const x = rayOrigin.x + rayDir.x * bestT + vw / 2;
    const y = near - bestS;
    if (x < 0 || x > vw || y < 0 || y > pageHeight) return null;

    // Seen from behind, the paper isn't interactive.
    const at = c.at(bestS);
    const facing = rayDir.y * at[3] + -rayDir.z * at[2];
    if (facing > 0) return null;
    return { x, y, s: bestS, plinth: bestPlinth };
  }

  /** Move the DOM so whatever is drawn under the cursor is really there for hover, click and drag. */
  function lockPointer(tx: number, ty: number) {
    if (!locked || Math.abs(locked[0] - tx) > 0.02 || Math.abs(locked[1] - ty) > 0.02) {
      locked = [tx, ty];
      canvas.updateElementGeometry(root, { canvasTransform: new DOMMatrix([1, 0, 0, 1, tx, ty]) });
    }
    // Nested drawables are positioned from the canvas, not from their parent.
    for (const d of sheet.drawables) {
      if (d.parked) continue;
      const x = locked[0] + d.x;
      const y = locked[1] + d.y;
      if (d.placed && d.placed !== ORIGIN && d.placed[0] === x && d.placed[1] === y) continue;
      d.placed = [x, y];
      canvas.updateElementGeometry(d.el, { canvasTransform: new DOMMatrix([1, 0, 0, 1, x, y]) });
    }
  }

  function updatePointer(near: number) {
    if (keyboardDriven || !pointer) {
      // Without a pointer, describe the page as if it were flat so tabbing can scroll to things.
      cursorPick = null;
      lockPointer(0, -smoothedScroll);
      return;
    }
    cursorPick = amount > 0.02 ? pick(pointer.x, pointer.y, near) : null;
    if (cursorPick) lockPointer(pointer.x - cursorPick.x, pointer.y - cursorPick.y);
    else if (amount <= 0.02) lockPointer(0, -smoothedScroll);
    else lockPointer(-200000, -200000);
  }

  // ── Frame ─────────────────────────────────────────────────────────────
  const project = (x: number, pageY: number, height: number, near: number) => {
    const at = curve!.at(near - pageY);
    projected.set(x, at[1] + at[3] * height, -(at[0] + at[2] * height)).project(camera);
    return {
      x: ((projected.x + 1) / 2) * vw,
      y: ((1 - projected.y) / 2) * vh,
      visible: projected.z < 1 && projected.z > -1,
    };
  };

  function setActiveSection(near: number) {
    const focus = near - vh * 0.5;
    let index = 0;
    sheet.sections.forEach((section, i) => {
      if (section.top <= focus) index = i;
    });
    if (index === activeSection) return;
    activeSection = index;
    const id = sheet.sections[index]?.id;
    railLinks.forEach((link, key) => {
      if (key === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function frame() {
    if (!alive) return;
    window.clearTimeout(firstPaintTimer);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    frames++;

    // Amount of expo: the tween that takes a flat page into the world and back.
    if (amount !== amountTo) {
      const t = amountLength <= 0 ? 1 : Math.min(1, (now - amountStart) / amountLength);
      amount = amountFrom + (amountTo - amountFrom) * t;
      if (t >= 1) {
        amount = amountTo;
        finish?.();
        finish = null;
        if (!alive || !attached) return;
      }
    }
    const shown = easeInOut(amount);
    const scroll = window.scrollY;
    smoothedScroll = reducedMotion
      ? scroll
      : smoothedScroll + (scroll - smoothedScroll) * damp(14, dt);
    if (Math.abs(scroll - smoothedScroll) < 0.05) smoothedScroll = scroll;
    const near = (nib?.controlsScroll() ? nib.scrollAt() : smoothedScroll) + vh;

    const finale = nib?.controlsScroll() ? 0 : smooth((scroll - (pageHeight - vh)) / tail);
    const opened = easeInOut(finale);
    const bend = smooth((amount - 0.22) / 0.78);
    const spiral = baseScale + (finaleScale() - baseScale) * opened;
    if (Math.abs(bend - builtBend) > 0.0005 || Math.abs(spiral - builtScale) > 0.5) {
      curve!.scale = spiral;
      curve!.build(bend);
      curveTexture!.needsUpdate = true;
      builtBend = bend;
      builtScale = spiral;
    }

    const c = common!;
    c.uNear.value = near;
    c.uAmount.value = shown;
    c.uFar.value = 1 + opened * 7;
    c.uRolled.value = 1 - opened;
    // Standing further back means depth can be spent where it's needed.
    const nearPlane = 20 + opened * 900;
    if (camera.near !== nearPlane) {
      camera.near = nearPlane;
      camera.updateProjectionMatrix();
    }
    // The ground is opaque, so it has to be gone before the roll opens up behind it.
    const groundShown = 1 - smooth(finale / 0.3);
    c.uGround.value = groundShown * shown;
    if (ground) ground.visible = groundShown > 0.001;

    // The curve starts to carry things up as they come near, and lays them flat in the roll.
    const rise = smooth((amount - 0.45) / 0.55);
    const gameFlat = nib?.flatten() ?? 1;
    for (const p of plinths) {
      const s = near - (p.d.y + p.d.h / 2);
      const approach = reducedMotion ? 1 : smooth((s + 560) / 620);
      const settle = 1 - smooth((s - curve!.start - 350) / 1500);
      p.d.lift = p.maxLift * rise * approach * settle * gameFlat;
      (p.mesh.material as THREE.ShaderMaterial).uniforms.uLift.value = p.d.lift;
      (p.shadow.material as THREE.ShaderMaterial).uniforms.uOffset.value.set(
        p.d.lift * 0.34,
        -p.d.lift * 0.5
      );
    }
    for (const h of headings) {
      const s = near - (h.d.y + h.d.h / 2);
      const settle = 1 - smooth((s - curve!.start - 400) / 1700);
      // Headings sink a little during a run, when the camera gets close enough to see their layers.
      const depth = h.maxDepth * rise * settle * (0.4 + 0.6 * gameFlat);
      h.depth.value = depth;
      h.offset.value.set(depth * 0.34, -depth * 0.5);
    }

    // Stepping up to an exhibit while typing in it.
    const active = document.activeElement;
    const typing =
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLInputElement && ['text', 'search'].includes(active.type));
    const owner = typing ? plinths.find((p) => p.d.el.contains(active))?.d : undefined;
    if (owner) stepUpTarget = owner;
    stepUp += ((owner ? 1 : 0) - stepUp) * damp(reducedMotion ? 60 : 5.5, dt);
    if (rail) {
      const hidden = Math.max(Math.min(1, stepUp * 1.6), nib?.cameraBlend() ?? 0, finale);
      rail.style.opacity = String(1 - hidden);
      rail.inert = hidden > 0.5;
    }

    if (pointer && !reducedMotion) {
      parallaxX += ((pointer.x / vw - 0.5) * 2 - parallaxX) * damp(2.6, dt);
      parallaxY += ((pointer.y / vh - 0.5) * 2 - parallaxY) * damp(2.6, dt);
    }

    nib?.update(dt);
    placeCamera(near, finale);

    sheet.update(near, curve!.start + 2200, firstFrame);
    firstFrame = false;

    renderer.resetState();
    renderer.render(scene, camera);

    updatePointer(near);
    setActiveSection(near);

    const railLink = railLinks.get(sheet.sections[activeSection]?.id ?? '');
    const box = railLink?.getBoundingClientRect();
    overlay.drawOverlay({
      width: vw,
      height: vh,
      near,
      amount,
      fade: smooth((amount - 0.7) / 0.3) * (1 - finale) * (1 - stepUp) * (nib?.overlayFade() ?? 1),
      sheetWidth: vw,
      pageHeight,
      curveStart: curve!.start,
      sections: sheet.sections,
      active: activeSection,
      drawables: sheet.drawables,
      finale,
      hint: 1 - smooth(scroll / 260),
      pavilionCount: sheet.sections.filter((section) => section.el.dataset.pavilion).length,
      project: (x, y, h) => project(x, y, h, near),
      angleAt: (s) => {
        const at = curve!.at(s);
        return THREE.MathUtils.radToDeg(Math.atan2(-at[2], at[3]));
      },
      railPoint: box ? { x: box.right, y: box.top + box.height / 2 } : null,
      cursor: cursorPick
        ? {
            x: cursorPick.x,
            y: cursorPick.y,
            s: cursorPick.s,
            angle: (() => {
              const at = curve!.at(cursorPick!.s);
              return THREE.MathUtils.radToDeg(Math.atan2(-at[2], at[3]));
            })(),
          }
        : null,
    });

    if (now - lastReadout > 400) {
      const seconds = (now - lastReadout) / 1000;
      setTele('mode', amount > 0 ? 'html in canvas, webgl2' : 'flat page');
      setTele('fps', `${Math.round(frames / seconds)} fps`);
      setTele(
        'uploads',
        `${Math.round((sheet.uploads - uploadsAtLastReadout) / seconds)} per second`
      );
      setTele('drawables', `${sheet.drawables.length + 1}`);
      setTele(
        'cursor',
        cursorPick ? `${Math.round(cursorPick.x)}, ${Math.round(cursorPick.y)}` : '—'
      );
      if (cursorPick) {
        const at = curve!.at(cursorPick.s);
        setTele('angle', `${THREE.MathUtils.radToDeg(Math.atan2(-at[2], at[3])).toFixed(1)}°`);
      } else {
        setTele('angle', '—');
      }
      frames = 0;
      uploadsAtLastReadout = sheet.uploads;
      lastReadout = now;
    }
  }

  const onPaint = () => {
    try {
      frame();
    } catch (error) {
      console.error(error);
      fail();
    }
  };

  // Runs before the browser paints; the paint event that follows does the drawing.
  function tick() {
    if (!alive || !attached) return;
    requestAnimationFrame(tick);
    sheet.prepare(
      canvas,
      (nib?.controlsScroll() ? nib.scrollAt() : smoothedScroll) + vh,
      curve!.start + 2200
    );
    canvas.requestPaint();
  }

  // ── Attaching and detaching ───────────────────────────────────────────
  function attach() {
    if (attached) return;
    attached = true;
    listeners = new AbortController();
    document.body.classList.add('is-expo');
    if (rail) rail.hidden = false;
    document.body.append(overlay.canvas);
    host
      .querySelectorAll<HTMLElement>('[data-expo]')
      .forEach((el) => el.setAttribute('drawable', ''));

    // In this order: an empty shadow root would hide the page, and there'd be nothing to measure.
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.replaceChildren(canvas);
    build();
    sheet.listen();
    smoothedScroll = window.scrollY;
    lastTime = performance.now();

    canvas.addEventListener('paint', onPaint, { signal: listeners.signal });
    const { signal } = listeners;
    window.addEventListener(
      'pointermove',
      (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        keyboardDriven = false;
      },
      { passive: true, signal }
    );
    document.documentElement.addEventListener('pointerleave', () => (pointer = null), { signal });
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Tab') keyboardDriven = true;
      },
      { capture: true, signal }
    );
    // A drawable waiting at the canvas origin can't be scrolled to by the browser, so tabbing into
    // one has to walk over there ourselves.
    host.addEventListener(
      'focusin',
      (event) => {
        if (!keyboardDriven) return;
        const d = sheet.drawables.find((item) => item.el.contains(event.target as Node));
        if (!d) return;
        scrollTo({ top: d.y - vh * 0.5, behavior: reducedMotion ? 'auto' : 'smooth' });
      },
      { signal }
    );
    // Same-page links can't trust the DOM's idea of where things are while it follows the cursor.
    document.addEventListener(
      'click',
      (event) => {
        const anchor = (event.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
        const id = anchor?.getAttribute('href')?.slice(1);
        const target = id ? sheet.sections.find((section) => section.id === id) : null;
        if (!target) return;
        event.preventDefault();
        scrollTo({ top: target.top, behavior: reducedMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', `#${id}`);
      },
      { capture: true, signal }
    );
    let resizeTimer = 0;
    window.addEventListener(
      'resize',
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (alive && attached) build();
        }, 160);
      },
      { signal }
    );

    firstPaintTimer = window.setTimeout(() => {
      if (!document.hidden) fail();
    }, 4000);
    requestAnimationFrame(tick);
  }

  function detach() {
    if (!attached) return;
    attached = false;
    nib?.stop();
    sheet.stop();
    listeners.abort();
    window.clearTimeout(firstPaintTimer);
    host.shadowRoot?.replaceChildren(document.createElement('slot'));
    host
      .querySelectorAll<HTMLElement>('[data-expo]')
      .forEach((el) => el.removeAttribute('drawable'));
    host.style.height = '';
    overlay.canvas.remove();
    if (rail) {
      rail.hidden = true;
      rail.inert = false;
      rail.style.opacity = '';
    }
    document.body.classList.remove('is-expo');
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY > maxScroll) window.scrollTo({ top: maxScroll, behavior: 'auto' });
    setTele('mode', 'flat page');
    for (const name of ['fps', 'uploads', 'drawables', 'cursor', 'angle']) setTele(name, '—');
  }

  function fail() {
    if (!alive) return;
    dispose();
    onFail();
  }

  function dispose() {
    alive = false;
    finish?.();
    finish = null;
    detach();
    clearScene();
    sheet.dispose();
    renderer.dispose();
  }

  // The nib game reaches into the world only through this.
  const nibHost: NibHost = {
    sheet,
    curve: () => curve!,
    common: () => common!,
    scene,
    camera,
    viewport: () => ({ width: vw, height: vh, pageHeight }),
    setScroll: (top) => window.scrollTo({ top, behavior: 'auto' }),
    onRunChange,
  };

  return {
    to(target) {
      if (target === 1) attach();
      amountFrom = amount;
      amountTo = target;
      amountStart = performance.now();
      amountLength = reducedMotion ? 0 : target === 1 ? 1900 : 1100;
      finish?.();
      return new Promise<void>((resolve) => {
        finish = () => {
          if (target === 0) detach();
          resolve();
        };
      });
    },
    amount: () => amount,
    startRun() {
      if (!attached || amount < 0.99) return;
      nib ??= new Nib(nibHost);
      nib.startRun();
    },
    running: () => !!nib?.controlsScroll(),
    dispose,
  };
}
