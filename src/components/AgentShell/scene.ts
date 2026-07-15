import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { KeyboardController } from './controllers/keyboard';
import { PointerController } from './controllers/pointer';
import { ResizeController } from './controllers/resize';
import { Terminal } from './domain/terminal';
import { BackgroundLayer } from './layers/background';
import { ShellLayer } from './layers/shell';
import { DEFAULT_PARAMS, type AgentParams } from './params';
import type { LayerGroup } from './tweaks/types';

export { DEFAULT_PARAMS } from './params';
export type { AgentParams } from './params';

const CURSOR_BLINK_MS = 530;
const TICK_MS = 16;
const DPR_SCALE = 2;

/**
 * Coordinator. Owns the renderer + composer, two scene layers (bg + shell),
 * the Terminal domain, and three input controllers. Each frame: update
 * controllers → drive parallax → redraw shell canvas if dirty → composer
 * renders bg behind shell with bloom on top.
 */
export class AgentScene {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  private bg: BackgroundLayer;
  private shell: ShellLayer;

  private terminal = new Terminal();
  private pointer: PointerController;
  private keyboard: KeyboardController;
  private resize: ResizeController;

  private params: AgentParams;
  private raf = 0;
  private startTime = performance.now();
  private dirty = true;
  private cursorOn = true;
  private blinkTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    params: Partial<AgentParams> = {},
    mobileInput?: HTMLInputElement
  ) {
    this.params = { ...DEFAULT_PARAMS, ...params };

    this.renderer = this.buildRenderer(canvas);
    this.composer = this.buildComposer();
    this.bloomPass = this.buildBloom();
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.camera.position.set(0, 0, 4);

    this.bg = new BackgroundLayer(this.scene, this.params);
    this.shell = new ShellLayer(
      this.scene,
      this.camera,
      DPR_SCALE,
      this.params,
      this.renderer.capabilities.getMaxAnisotropy()
    );

    this.pointer = new PointerController(container);
    this.keyboard = new KeyboardController(mobileInput);
    this.resize = new ResizeController(container);

    this.wire(mobileInput);
    this.terminal.boot(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.resize.trigger();
    this.tick();
  }

  // ── Public API ──

  setParam<K extends keyof AgentParams>(k: K, v: AgentParams[K]) {
    this.params[k] = v;
    if (k === 'bloom') {
      this.bloomPass.strength = bloomStrength(v as number);
      return;
    }
    const handledByBg = this.bg.setParam(k, v);
    const handledByShell = this.shell.setParam(k, v);
    // Anything not absorbed by a uniform mutates the shell canvas.
    if (!handledByBg && !handledByShell) this.dirty = true;
  }

  getParams(): AgentParams {
    return { ...this.params };
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.terminal.dispose();
    this.resize.dispose();
    this.pointer.dispose();
    this.keyboard.dispose();
    this.shell.dispose();
    this.bg.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  // ── Wiring ──

  private wire(mobileInput?: HTMLInputElement) {
    this.terminal.onChange(() => {
      this.keyboard.syncMobileInput(this.terminal.input);
      this.dirty = true;
    });

    this.pointer.onDown(() => mobileInput?.focus({ preventScroll: true }));
    this.pointer.onWheel((lines) => this.terminal.scrollBy(lines));

    this.keyboard.on((e) => {
      switch (e.kind) {
        case 'submit':
          this.terminal.submit();
          break;
        case 'backspace':
          this.terminal.backspace();
          break;
        case 'history-prev':
          this.terminal.historyPrev();
          break;
        case 'history-next':
          this.terminal.historyNext();
          break;
        case 'clear-screen':
          this.terminal.clearScreen();
          break;
        case 'scroll':
          this.terminal.scrollBy(e.lines);
          break;
        case 'char':
          this.terminal.appendInput(e.ch);
          break;
        case 'set-input':
          this.terminal.setInput(e.value);
          break;
      }
    });

    this.resize.on((w, h) => this.handleResize(w, h));
  }

  // ── Engine setup ──

  private buildRenderer(canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    return renderer;
  }

  private buildComposer() {
    const composer = new EffectComposer(this.renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return composer;
  }

  private buildBloom() {
    return new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      bloomStrength(this.params.bloom),
      0.34,
      0.32
    );
  }

  // ── Resize ──

  private handleResize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.shell.resize(w, h);
    this.bg.setResolution(w, h);
    this.dirty = true;
  }

  // ── Animation loop ──

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);

    const t = (performance.now() - this.startTime) / 1000;
    this.bg.setTime(t);

    this.pointer.update();
    const p = this.params.parallax;
    this.camera.position.x = this.pointer.mx * 0.45 * p;
    this.camera.position.y = -this.pointer.my * 0.3 * p;
    this.camera.lookAt(0, 0, 0);
    this.shell.setParallax(this.pointer.mx * p * 0.4, this.pointer.my * p * 0.4);

    this.blinkTimer += TICK_MS;
    if (this.blinkTimer > CURSOR_BLINK_MS) {
      this.blinkTimer = 0;
      this.cursorOn = !this.cursorOn;
      this.dirty = true;
    }

    if (this.dirty) {
      this.shell.redraw(this.terminal, this.params, this.cursorOn);
      this.dirty = false;
    }
    this.composer.render();
  };
}

function bloomStrength(value: number) {
  return Math.max(0, value) * 0.9;
}

/** Tweaks owned by the scene itself: camera + bloom. */
export const SCENE_LAYER: LayerGroup = {
  layer: 'Scene',
  sections: [
    {
      title: 'Camera',
      controls: [{ type: 'range', key: 'parallax', label: 'Parallax', min: 0, max: 3, step: 0.05 }],
    },
    {
      title: 'Postprocess',
      controls: [{ type: 'range', key: 'bloom', label: 'Bloom', min: 0, max: 2, step: 0.02 }],
    },
  ],
};
