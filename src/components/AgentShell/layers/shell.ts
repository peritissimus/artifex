import * as THREE from 'three';

import type { Terminal } from '../domain/terminal';
import type { AgentParams } from '../params';
import shellFragment from '../shaders/shell/frag.glsl?raw';
import shellVertex from '../shaders/shell/vert.glsl?raw';
import type { LayerGroup } from '../tweaks/types';
import { drawBody } from '../view/body';
import { drawChrome } from '../view/chrome';
import { drawScanlines } from '../view/effects';
import { computeLayout, computeWindowSize } from '../view/layout';

/**
 * The terminal shell as a curved plane in front of the bg, sized to the
 * window. Owns a 2D canvas painted with chrome + body + scanlines, plus
 * a vertex shader that bends the bottom corners (CRT glass) and a
 * fragment shader that applies a subtle texture barrel distortion.
 */
export class ShellLayer {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  readonly canvas = document.createElement('canvas');
  readonly ctx: CanvasRenderingContext2D;
  readonly texture: THREE.CanvasTexture;

  private planeW = 1;
  private planeH = 1;

  constructor(
    parent: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private dprScale: number,
    params: AgentParams,
    anisotropy: number
  ) {
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.anisotropy = anisotropy;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: this.texture },
        uOpacity: { value: params.opacity },
        uCurve: { value: params.curve },
        uLensWarp: { value: params.lensWarp },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: shellVertex,
      fragmentShader: shellFragment,
    });

    // Geometry is replaced on resize. Subdivision count is high so the
    // bottom barrel curve renders smoothly.
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 60, 40), this.material);
    parent.add(this.mesh);
  }

  /** Resize the plane geometry + canvas to match the current viewport. */
  resize(viewportCssW: number, viewportCssH: number) {
    const size = computeWindowSize(viewportCssW, viewportCssH);

    const visH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const visW = visH * (viewportCssW / viewportCssH);
    this.planeW = (size.w / viewportCssW) * visW;
    this.planeH = (size.h / viewportCssH) * visH;

    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(this.planeW, this.planeH, 60, 40);

    this.canvas.width = Math.round(size.w * this.dprScale);
    this.canvas.height = Math.round(size.h * this.dprScale);
  }

  setParallax(mx: number, my: number) {
    this.material.uniforms.uMouse.value.set(mx, my);
  }

  /** Returns true if the param landed in a shell shader uniform. */
  setParam<K extends keyof AgentParams>(k: K, v: AgentParams[K]): boolean {
    const u = this.material.uniforms;
    switch (k) {
      case 'opacity':
        u.uOpacity.value = v as number;
        return true;
      case 'curve':
        u.uCurve.value = v as number;
        return true;
      case 'lensWarp':
        u.uLensWarp.value = v as number;
        return true;
    }
    return false;
  }

  redraw(terminal: Terminal, params: AgentParams, cursorOn: boolean) {
    if (!this.canvas.width || !this.canvas.height) return;

    const layout = computeLayout(this.canvas.width, this.canvas.height, this.dprScale, params);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, layout.W, layout.H);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    drawChrome(ctx, layout);
    drawBody(ctx, layout, terminal, cursorOn, params.accent);
    drawScanlines(ctx, layout, params.scanlines);

    this.texture.needsUpdate = true;
  }

  dispose() {
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.texture.dispose();
  }
}

/** Tweaks owned by the shell layer. */
export const SHELL_LAYER: LayerGroup = {
  layer: 'Shell',
  sections: [
    {
      title: 'Glass',
      controls: [
        { type: 'range', key: 'curve', label: 'Curve', min: 0, max: 1, step: 0.01 },
        { type: 'range', key: 'lensWarp', label: 'Lens Warp', min: 0, max: 0.3, step: 0.005 },
      ],
    },
    {
      title: 'Window',
      controls: [
        { type: 'range', key: 'opacity', label: 'Opacity', min: 0.4, max: 1, step: 0.01 },
        { type: 'range', key: 'scanlines', label: 'Scanlines', min: 0, max: 1, step: 0.02 },
      ],
    },
    {
      title: 'Text',
      controls: [
        { type: 'range', key: 'fontSize', label: 'Font Size', min: 10, max: 22, step: 0.5 },
      ],
    },
    {
      title: 'Color',
      controls: [{ type: 'color', key: 'accent', label: 'Accent' }],
    },
  ],
};
