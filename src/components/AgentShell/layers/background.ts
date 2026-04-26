import * as THREE from 'three';

import type { AgentParams } from '../params';
import bgFragment from '../shaders/bg/frag.glsl?raw';
import bgVertex from '../shaders/bg/vert.glsl?raw';
import type { LayerGroup } from '../tweaks/types';

const BG_PARAM_UNIFORMS: ReadonlySet<keyof AgentParams> = new Set([
  'vignette',
  'grain',
  'flicker',
]);

/**
 * Far-back room plane: neutral dark gradient, edge darkening, and
 * atmospheric noise (vignette / grain / flicker). No accent light —
 * the bg stays purely dark; whatever halo the shell needs comes
 * from the post-process bloom pass.
 */
export class BackgroundLayer {
  readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(parent: THREE.Scene, params: AgentParams) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uVignette: { value: params.vignette },
        uGrain: { value: params.grain },
        uFlicker: { value: params.flicker },
      },
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 14, 1, 1), this.material);
    this.mesh.position.z = -3.5;
    parent.add(this.mesh);
  }

  setTime(t: number) {
    this.material.uniforms.uTime.value = t;
  }

  setResolution(w: number, h: number) {
    this.material.uniforms.uResolution.value.set(w, h);
  }

  /** Returns true if the param landed in a uniform here. */
  setParam<K extends keyof AgentParams>(k: K, v: AgentParams[K]): boolean {
    if (!BG_PARAM_UNIFORMS.has(k)) return false;
    const u = this.material.uniforms;
    switch (k) {
      case 'vignette':
        u.uVignette.value = v as number;
        return true;
      case 'grain':
        u.uGrain.value = v as number;
        return true;
      case 'flicker':
        u.uFlicker.value = v as number;
        return true;
    }
    return false;
  }

  dispose() {
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}

/** Tweaks owned by the background layer: room atmosphere only. */
export const BG_LAYER: LayerGroup = {
  layer: 'Background',
  sections: [
    {
      title: 'Atmosphere',
      controls: [
        { type: 'range', key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.01 },
        { type: 'range', key: 'grain', label: 'Grain', min: 0, max: 1, step: 0.02 },
        { type: 'range', key: 'flicker', label: 'Flicker', min: 0, max: 1, step: 0.02 },
      ],
    },
  ],
};
