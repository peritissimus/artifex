import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { KeyboardController } from './controllers/keyboard';
import { PointerController } from './controllers/pointer';
import { ResizeController } from './controllers/resize';
import { Terminal } from './domain/terminal';
import { DEFAULT_PARAMS, type AgentParams } from './params';
import { bgFragment, bgVertex } from './shaders/bg.glsl';
import { planeFragment, planeVertex } from './shaders/plane.glsl';
import { drawBody } from './view/body';
import { drawChrome } from './view/chrome';
import { drawGlow, drawScanlines } from './view/effects';
import { computeLayout } from './view/layout';

export { DEFAULT_PARAMS } from './params';
export type { AgentParams } from './params';

const CURSOR_BLINK_MS = 530;
const TICK_MS = 16;

/**
 * Coordinates the Three.js scene with controllers and the terminal domain.
 * Owns the renderer, composer, two meshes (bg + curved window plane), and
 * the canvas-2D texture that holds the terminal UI. Controllers translate
 * input device events into Terminal calls; redraw() repaints when dirty.
 */
export class AgentScene {
  // — Engine —
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  // — Scene graph —
  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private bgMesh!: THREE.Mesh;
  private bgMaterial!: THREE.ShaderMaterial;

  // — Texture —
  private texCanvas = document.createElement('canvas');
  private texCtx: CanvasRenderingContext2D;
  private texture!: THREE.CanvasTexture;

  // — Domain + controllers —
  private terminal = new Terminal();
  private pointer: PointerController;
  private keyboard: KeyboardController;
  private resize: ResizeController;

  // — Render loop state —
  private params: AgentParams;
  private dprScale = 2;
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

    this.texCtx = this.texCanvas.getContext('2d')!;
    this.texture = this.buildTexture();

    this.buildBg();
    this.buildMesh();

    this.pointer = new PointerController(container);
    this.keyboard = new KeyboardController(mobileInput);
    this.resize = new ResizeController(container);

    this.wire(mobileInput);
    this.resize.trigger();
    this.tick();
  }

  // ── Public API ──

  setParam<K extends keyof AgentParams>(k: K, v: AgentParams[K]) {
    this.params[k] = v;
    const u = this.material.uniforms;
    if (k === 'curve') u.uCurve.value = v as number;
    else if (k === 'tilt') u.uTilt.value = v as number;
    else if (k === 'vignette') u.uVignette.value = v as number;
    else if (k === 'opacity') u.uOpacity.value = v as number;
    else if (k === 'grain') u.uGrain.value = v as number;
    else if (k === 'flicker') u.uFlicker.value = v as number;
    else if (k === 'crt') u.uCrt.value = v as number;
    else if (k === 'bloom') this.bloomPass.strength = bloomStrength(v as number);
    // Anything else changes the texture-canvas content, which redraw() handles.
    if (REDRAW_PARAMS.has(k)) this.dirty = true;
  }

  getParams(): AgentParams {
    return { ...this.params };
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resize.dispose();
    this.pointer.dispose();
    this.keyboard.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.bgMaterial.dispose();
    this.bgMesh.geometry.dispose();
    this.texture.dispose();
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

  private buildTexture() {
    const tex = new THREE.CanvasTexture(this.texCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  private buildBg() {
    this.bgMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
    });
    this.bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 14, 1, 1), this.bgMaterial);
    this.bgMesh.position.z = -3.5;
    this.scene.add(this.bgMesh);
  }

  private buildMesh() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: this.texture },
        uCurve: { value: this.params.curve },
        uTilt: { value: this.params.tilt },
        uVignette: { value: this.params.vignette },
        uOpacity: { value: this.params.opacity },
        uGrain: { value: this.params.grain },
        uFlicker: { value: this.params.flicker },
        uCrt: { value: this.params.crt },
        uMx: { value: 0 },
        uMy: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uBodyMin: { value: new THREE.Vector2(0, 0) },
        uBodyMax: { value: new THREE.Vector2(1, 1) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: planeVertex,
      fragmentShader: planeFragment,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 80, 80), this.material);
    this.scene.add(this.mesh);
  }

  // ── Resize ──

  private handleResize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    const visH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const visW = visH * aspect;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(visW, visH, 80, 80);

    this.texCanvas.width = Math.round(w * this.dprScale);
    this.texCanvas.height = Math.round(h * this.dprScale);
    this.material.uniforms.uResolution.value.set(this.texCanvas.width, this.texCanvas.height);
    this.dirty = true;
  }

  // ── Texture redraw ──

  private redraw() {
    const layout = computeLayout(
      this.texCanvas.width,
      this.texCanvas.height,
      this.dprScale,
      this.params
    );

    this.material.uniforms.uBodyMin.value.set(layout.bodyUvMin.x, layout.bodyUvMin.y);
    this.material.uniforms.uBodyMax.value.set(layout.bodyUvMax.x, layout.bodyUvMax.y);

    const ctx = this.texCtx;
    ctx.clearRect(0, 0, layout.W, layout.H);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    drawChrome(ctx, layout);
    drawBody(ctx, layout, this.terminal, this.cursorOn, this.params.accent);
    drawScanlines(ctx, layout, this.params.scanlines);
    drawGlow(ctx, layout, this.params.glow, this.params.accent);

    this.texture.needsUpdate = true;
    this.dirty = false;
  }

  // ── Animation loop ──

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);

    const t = (performance.now() - this.startTime) / 1000;
    this.material.uniforms.uTime.value = t;
    this.bgMaterial.uniforms.uTime.value = t;

    this.pointer.update();
    const p = this.params.parallax;
    this.camera.position.x = this.pointer.mx * 0.45 * p;
    this.camera.position.y = -this.pointer.my * 0.3 * p;
    this.camera.lookAt(0, 0, 0);
    this.material.uniforms.uMx.value = this.pointer.mx * p * 0.4;
    this.material.uniforms.uMy.value = this.pointer.my * p * 0.4;

    this.blinkTimer += TICK_MS;
    if (this.blinkTimer > CURSOR_BLINK_MS) {
      this.blinkTimer = 0;
      this.cursorOn = !this.cursorOn;
      this.dirty = true;
    }

    if (this.dirty) this.redraw();
    this.composer.render();
  };
}

/** Params that mutate the texture canvas content (no shader uniform). */
const REDRAW_PARAMS: ReadonlySet<keyof AgentParams> = new Set([
  'fontSize',
  'glow',
  'accent',
  'scanlines',
]);

function bloomStrength(value: number) {
  return Math.max(0, value) * 0.9;
}
