type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

declare module "three" {
  export const AdditiveBlending: number;
  export const LinearFilter: number;
  export const NeutralToneMapping: number;
  export const SRGBColorSpace: string;

  type Vector3Like = {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): void;
  };

  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): void;
  }

  export class Scene {
    add(...objects: unknown[]): void;
  }

  export class Camera {
    position: Vector3Like;
    lookAt(x: number, y: number, z: number): void;
    updateProjectionMatrix(): void;
  }

  export class PerspectiveCamera extends Camera {
    aspect: number;
    fov: number;
    constructor(fov: number, aspect: number, near: number, far: number);
  }

  export class WebGLRenderTarget {}

  export class WebGLRenderer {
    capabilities: { getMaxAnisotropy(): number };
    domElement: HTMLCanvasElement;
    outputColorSpace: string;
    toneMapping: number;
    toneMappingExposure: number;
    constructor(params?: Record<string, unknown>);
    dispose(): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    setClearColor(color: number, alpha?: number): void;
    setPixelRatio(pixelRatio: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }

  export class CanvasTexture {
    anisotropy: number;
    colorSpace: string;
    magFilter: number;
    minFilter: number;
    needsUpdate: boolean;
    constructor(canvas: HTMLCanvasElement);
    dispose(): void;
  }

  export class PlaneGeometry {
    constructor(width: number, height: number, widthSegments?: number, heightSegments?: number);
    dispose(): void;
  }

  export class BufferAttribute {
    constructor(array: Float32Array, itemSize: number);
  }

  export class BufferGeometry {
    dispose(): void;
    setAttribute(name: string, attribute: BufferAttribute): void;
  }

  export class ShaderMaterial {
    uniforms: Record<string, { value: any }>;
    constructor(params?: Record<string, unknown>);
    dispose(): void;
  }

  export class Mesh {
    geometry: PlaneGeometry;
    position: Vector3Like;
    constructor(geometry?: PlaneGeometry, material?: ShaderMaterial);
  }

  export class Points {
    constructor(geometry?: BufferGeometry, material?: ShaderMaterial);
  }
}

declare module "three/addons/postprocessing/EffectComposer.js" {
  import type { Pass } from "three/addons/postprocessing/Pass.js";
  import type { WebGLRenderer, WebGLRenderTarget } from "three";

  export class EffectComposer {
    constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
    addPass(pass: Pass): void;
    setPixelRatio(pixelRatio: number): void;
    setSize(width: number, height: number): void;
    render(deltaTime?: number): void;
    dispose(): void;
  }
}

declare module "three/addons/postprocessing/OutputPass.js" {
  import type { Pass } from "three/addons/postprocessing/Pass.js";

  export class OutputPass extends Pass {}
}

declare module "three/addons/postprocessing/RenderPass.js" {
  import type { Camera, Scene } from "three";
  import type { Pass } from "three/addons/postprocessing/Pass.js";

  export class RenderPass extends Pass {
    constructor(scene: Scene, camera: Camera);
  }
}

declare module "three/addons/postprocessing/UnrealBloomPass.js" {
  import type { Vector2 } from "three";
  import type { Pass } from "three/addons/postprocessing/Pass.js";

  export class UnrealBloomPass extends Pass {
    strength: number;
    radius: number;
    threshold: number;
    resolution: Vector2;

    constructor(resolution?: Vector2, strength?: number, radius?: number, threshold?: number);
  }
}

declare module "three/addons/postprocessing/Pass.js" {
  export class Pass {
    enabled: boolean;
    needsSwap: boolean;
    clear: boolean;
    renderToScreen: boolean;
    setSize(width: number, height: number): void;
    dispose(): void;
  }
}
