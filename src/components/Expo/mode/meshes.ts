// Geometry for the expo, all of it in page coordinates (see shaders.ts).

import * as THREE from 'three';
import type { Drawable, Tile } from './sheet';
import { TILE_HEIGHT } from './sheet';
import {
  extrudeFaceFragment,
  extrudeShadowFragment,
  extrudeShadowVertex,
  extrudeVertex,
  extrudeWallFragment,
  groundFragment,
  groundVertex,
  lineFragment,
  lineVertex,
  paperFragment,
  paperVertex,
  plinthFragment,
  plinthVertex,
  shadowFragment,
  shadowVertex,
} from './shaders';

export type Common = {
  uCurve: { value: THREE.DataTexture };
  uRange: { value: number };
  uNear: { value: number };
  uAmount: { value: number };
  uVoid: { value: THREE.Vector3 };
  uGround: { value: number };
  /** Grows towards the finale, when the camera stands far enough back to see the whole roll. */
  uFar: { value: number };
  /** How much the inside of the roll is shaded: none once the finale has opened it up. */
  uRolled: { value: number };
  /** 1 while line work draws itself in as it arrives, 0 to show it all at once. */
  uReveal: { value: number };
  /** The page point under the cursor, and how strongly to react to it. */
  uCursor: { value: THREE.Vector3 };
  uCursorLift: { value: number };
  /** Scroll speed, in page pixels a second. */
  uVelocity: { value: number };
  /** The current pavilion's colour, washing into the void. */
  uTint: { value: THREE.Vector3 };
  uCurveStart: { value: number };
  /** How present the line work is: none on the flat page, where it would float over the paper. */
  uWires: { value: number };
  /** How tall the line work stands: less so when the whole sheet is in view. */
  uStand: { value: number };
  /** Size of a device pixel in clip space. */
  uPixel: { value: THREE.Vector2 };
  uTime: { value: number };
};

/** `#rrggbb` as raw 0..1 values. Three's colour management would convert it, and nothing else here is linear. */
export function rgb(hex: string) {
  const value = parseInt(hex.replace('#', ''), 16) || 0;
  return new THREE.Vector3(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  );
}

function grid(x0: number, x1: number, y0: number, y1: number, cols: number, rows: number, z = 0) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      positions.push(x0 + ((x1 - x0) * c) / cols, y0 + ((y1 - y0) * r) / rows, z);
      uvs.push(c / cols, r / rows);
    }
  }
  const w = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * w + c;
      indices.push(a, a + w, a + 1, a + 1, a + w, a + w + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** A pixel off the paper is less than the depth buffer can resolve from across the expo. */
const ABOVE_PAPER = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -24 };

const worldMesh = <T extends THREE.Object3D>(object: T, order = 0) => {
  object.frustumCulled = false;
  object.renderOrder = order;
  return object;
};

export function tileMesh(tile: Tile, width: number, common: Common) {
  const geometry = grid(-width / 2, width / 2, tile.top, tile.top + TILE_HEIGHT, 4, 56);
  const material = new THREE.ShaderMaterial({
    vertexShader: paperVertex,
    fragmentShader: paperFragment,
    side: THREE.DoubleSide,
    uniforms: { ...common, map: { value: tile.map }, uDim: { value: 1 } },
  });
  // The last tile is usually short: cut the mesh off where the page ends.
  if (tile.height < TILE_HEIGHT) {
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < attribute.count; i++) {
      const y = Math.min(attribute.getY(i), tile.top + tile.height);
      attribute.setY(i, y);
      uv.setY(i, (y - tile.top) / TILE_HEIGHT);
    }
  }
  return worldMesh(new THREE.Mesh(geometry, material), 1);
}

export function groundMesh(pageHeight: number, common: Common) {
  const geometry = grid(-9000, 9000, -4000, pageHeight + 6000, 1, 1100, -6);
  const material = new THREE.ShaderMaterial({
    vertexShader: groundVertex,
    fragmentShader: groundFragment,
    side: THREE.DoubleSide,
    uniforms: { ...common },
  });
  return worldMesh(new THREE.Mesh(geometry, material), 0);
}

/** A raised box whose top is the live element and whose walls take the sheet's colour. */
export function plinthMesh(d: Drawable, wall: THREE.Vector3, common: Common) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const sides: number[] = [];
  const indices: number[] = [];
  const x0 = d.x - 0;
  const x1 = d.x + d.w;
  const y0 = d.y;
  const y1 = d.y + d.h;
  const rows = Math.ceil(d.h / 30);

  const patch = (
    corner: (u: number, v: number) => [number, number, number],
    cols: number,
    rowCount: number,
    side: number,
    uv?: (u: number, v: number) => [number, number]
  ) => {
    const base = positions.length / 3;
    for (let r = 0; r <= rowCount; r++) {
      for (let c = 0; c <= cols; c++) {
        const u = c / cols;
        const v = r / rowCount;
        positions.push(...corner(u, v));
        uvs.push(...(uv ? uv(u, v) : [u, v]));
        sides.push(side);
      }
    }
    const w = cols + 1;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < cols; c++) {
        const a = base + r * w + c;
        indices.push(a, a + w, a + 1, a + 1, a + w, a + w + 1);
      }
    }
  };

  const across = (u: number) => x0 + (x1 - x0) * u;
  const along = (v: number) => y0 + (y1 - y0) * v;
  patch((u, v) => [across(u), along(v), 1], 2, rows, 0);
  patch((u, v) => [across(u), y1, 1 - v], 2, 1, 1); // near wall, lit
  patch((u, v) => [across(u), y0, v], 2, 1, 0.5); // far wall
  patch((u, v) => [x0, along(v), u], 1, rows, 0.68); // left wall
  patch((u, v) => [x1, along(v), 1 - u], 1, rows, 0.68); // right wall

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    vertexShader: plinthVertex,
    fragmentShader: plinthFragment,
    side: THREE.DoubleSide,
    ...ABOVE_PAPER,
    uniforms: {
      ...common,
      map: { value: d.map },
      uLift: { value: 0 },
      uWall: { value: wall },
      uSize: { value: new THREE.Vector2(d.w, d.h) },
    },
  });
  return worldMesh(new THREE.Mesh(geometry, material), 3);
}

export function plinthShadow(d: Drawable, common: Common) {
  const margin = 54;
  const w = d.w + margin * 2;
  const h = d.h + margin * 2;
  const geometry = grid(
    d.x - margin,
    d.x + d.w + margin,
    d.y - margin,
    d.y + d.h + margin,
    1,
    Math.ceil(h / 40),
    1
  );
  const material = new THREE.ShaderMaterial({
    vertexShader: shadowVertex,
    fragmentShader: shadowFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...common,
      uOffset: { value: new THREE.Vector2() },
      uSize: { value: new THREE.Vector2(w, h) },
      uSoft: { value: margin * 1.6 },
      uStrength: { value: 0.5 },
    },
  });
  return worldMesh(new THREE.Mesh(geometry, material), 2);
}

const LAYERS = 44;

/** A heading built like a stack of paper cut-outs: one texture, drawn many times. */
export function extrudedHeading(
  d: Drawable,
  wall: THREE.Vector3,
  ink: THREE.Vector3,
  stock: THREE.Vector3,
  common: Common
) {
  const colours = { uInk: { value: ink }, uStock: { value: stock } };
  const rows = Math.max(4, Math.ceil(d.h / 26));
  const group = new THREE.Group();
  group.frustumCulled = false;

  const base = grid(d.x, d.x + d.w, d.y, d.y + d.h, 1, rows);
  const walls = new THREE.InstancedBufferGeometry();
  walls.index = base.index;
  walls.setAttribute('position', base.getAttribute('position'));
  walls.setAttribute('uv', base.getAttribute('uv'));
  walls.setAttribute(
    'aLayer',
    new THREE.InstancedBufferAttribute(
      Float32Array.from({ length: LAYERS }, (_, i) => i / (LAYERS - 1)),
      1
    )
  );
  walls.instanceCount = LAYERS;

  const depth = { value: 0 };
  const wallMaterial = new THREE.ShaderMaterial({
    vertexShader: extrudeVertex,
    fragmentShader: extrudeWallFragment,
    side: THREE.DoubleSide,
    ...ABOVE_PAPER,
    uniforms: {
      ...common,
      ...colours,
      map: { value: d.map },
      uWall: { value: wall },
      uDepth: depth,
    },
  });
  group.add(worldMesh(new THREE.Mesh(walls, wallMaterial), 3));

  const faceGeometry = grid(d.x, d.x + d.w, d.y, d.y + d.h, 1, rows);
  const count = (faceGeometry.getAttribute('position') as THREE.BufferAttribute).count;
  faceGeometry.setAttribute(
    'aLayer',
    new THREE.Float32BufferAttribute(new Array(count).fill(1), 1)
  );
  const faceMaterial = new THREE.ShaderMaterial({
    vertexShader: extrudeVertex,
    fragmentShader: extrudeFaceFragment,
    side: THREE.DoubleSide,
    ...ABOVE_PAPER,
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquation: THREE.AddEquation,
    uniforms: { ...common, ...colours, map: { value: d.map }, uDepth: depth },
  });
  group.add(worldMesh(new THREE.Mesh(faceGeometry, faceMaterial), 4));

  const shadowGeometry = grid(d.x, d.x + d.w, d.y, d.y + d.h, 1, rows);
  const offset = { value: new THREE.Vector2() };
  const shadowMaterial = new THREE.ShaderMaterial({
    vertexShader: extrudeShadowVertex,
    fragmentShader: extrudeShadowFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...common,
      ...colours,
      map: { value: d.map },
      uOffset: offset,
      uStrength: { value: 0.42 },
    },
  });
  group.add(worldMesh(new THREE.Mesh(shadowGeometry, shadowMaterial), 2));

  return { group, depth, offset };
}

export function lineMaterial(common: Common, opacity = 1) {
  return new THREE.ShaderMaterial({
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...common,
      uColor: { value: new THREE.Vector3(0.96, 0.93, 0.86) },
      uOpacity: { value: opacity },
    },
  });
}

export function lineSegments(
  positions: Float32Array,
  brightness: Float32Array,
  material: THREE.ShaderMaterial,
  order = 5
) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aBright', new THREE.BufferAttribute(brightness, 1));
  return worldMesh(new THREE.LineSegments(geometry, material), order);
}

/** Hairlines down both edges of the sheet. */
export function sheetEdges(width: number, pageHeight: number, common: Common) {
  const step = 40;
  const count = Math.ceil(pageHeight / step);
  const positions = new Float32Array(count * 12);
  const brightness = new Float32Array(count * 4).fill(0.9);
  for (let i = 0; i < count; i++) {
    const y0 = i * step;
    const y1 = Math.min(pageHeight, y0 + step);
    positions.set(
      [-width / 2, y0, 1, -width / 2, y1, 1, width / 2, y0, 1, width / 2, y1, 1],
      i * 12
    );
  }
  return lineSegments(positions, brightness, lineMaterial(common), 2);
}
