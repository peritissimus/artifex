declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "three" {
  export const AddEquation: number;
  export const AdditiveBlending: number;
  export const CustomBlending: number;
  export const DoubleSide: number;
  export const FloatType: number;
  export const LinearFilter: number;
  export const LinearSRGBColorSpace: string;
  export const NearestFilter: number;
  export const NeutralToneMapping: number;
  export const OneFactor: number;
  export const OneMinusSrcAlphaFactor: number;
  export const RGBAFormat: number;
  export const SRGBColorSpace: string;

  export const MathUtils: {
    degToRad(degrees: number): number;
    radToDeg(radians: number): number;
  };

  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
  }

  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    copy(v: Vector3): this;
    clone(): Vector3;
    sub(v: Vector3): this;
    lerp(v: Vector3, alpha: number): this;
    normalize(): this;
    multiplyScalar(scalar: number): this;
    addScaledVector(v: Vector3, scale: number): this;
    project(camera: Camera): this;
    unproject(camera: Camera): this;
  }

  export class Color {
    setRGB(r: number, g: number, b: number): this;
  }

  export class Object3D {
    frustumCulled: boolean;
    position: Vector3;
    renderOrder: number;
    up: Vector3;
    visible: boolean;
    add(...objects: unknown[]): this;
    clear(): this;
    traverse(callback: (object: Object3D) => void): void;
    updateMatrixWorld(force?: boolean): void;
  }

  export class Scene extends Object3D {}

  export class Group extends Object3D {}

  export class Camera extends Object3D {
    lookAt(x: number | Vector3, y?: number, z?: number): void;
    updateProjectionMatrix(): void;
  }

  export class PerspectiveCamera extends Camera {
    aspect: number;
    far: number;
    fov: number;
    near: number;
    constructor(fov: number, aspect: number, near: number, far: number);
  }

  export class WebGLRenderTarget {}

  export class WebGLRenderer {
    capabilities: { getMaxAnisotropy(): number };
    domElement: HTMLCanvasElement;
    outputColorSpace: string;
    sortObjects: boolean;
    toneMapping: number;
    toneMappingExposure: number;
    constructor(params?: Record<string, unknown>);
    dispose(): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    resetState(): void;
    setClearColor(color: number | Color, alpha?: number): void;
    setPixelRatio(pixelRatio: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }

  export class Texture {
    magFilter: number;
    minFilter: number;
    needsUpdate: boolean;
    dispose(): void;
  }

  export class CanvasTexture extends Texture {
    anisotropy: number;
    colorSpace: string;
    constructor(canvas: HTMLCanvasElement);
  }

  export class DataTexture extends Texture {
    constructor(data: Float32Array, width: number, height: number, format: number, type: number);
  }

  export class ExternalTexture extends Texture {
    sourceTexture: WebGLTexture | null;
    constructor(sourceTexture?: WebGLTexture | null);
  }

  export class BufferAttribute {
    count: number;
    needsUpdate: boolean;
    constructor(array: Float32Array, itemSize: number);
    getY(index: number): number;
    setY(index: number, value: number): this;
    setXYZ(index: number, x: number, y: number, z: number): this;
  }

  export class Float32BufferAttribute extends BufferAttribute {
    constructor(array: number[], itemSize: number);
  }

  export class InstancedBufferAttribute extends BufferAttribute {}

  export class BufferGeometry {
    index: unknown;
    dispose(): void;
    getAttribute(name: string): BufferAttribute;
    setAttribute(name: string, attribute: BufferAttribute): this;
    setIndex(indices: number[]): this;
  }

  export class InstancedBufferGeometry extends BufferGeometry {
    instanceCount: number;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width: number, height: number, widthSegments?: number, heightSegments?: number);
  }

  export class Material {
    side: number;
    dispose(): void;
  }

  export class ShaderMaterial extends Material {
    uniforms: Record<string, { value: any }>;
    constructor(params?: Record<string, unknown>);
  }

  export class Mesh extends Object3D {
    geometry: BufferGeometry;
    material: Material;
    constructor(geometry?: BufferGeometry, material?: Material);
  }

  export class LineSegments extends Object3D {
    geometry: BufferGeometry;
    material: Material;
    constructor(geometry?: BufferGeometry, material?: Material);
  }

  export class Points extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
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
