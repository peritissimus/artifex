// GLSL for the expo. Every mesh keeps its vertices in page coordinates (x, page y, height off the
// paper) and `place` carries them onto the curve, so scrolling only ever changes one uniform.

import { CURVE_SAMPLES } from './curve';

const CURVE = /* glsl */ `
  uniform highp sampler2D uCurve;
  uniform float uRange;
  uniform float uNear;

  vec4 curveAt(float s) {
    float t = clamp(s, 0.0, uRange) / uRange * ${(CURVE_SAMPLES - 1).toFixed(1)};
    int i = int(floor(t));
    vec4 a = texelFetch(uCurve, ivec2(min(i, ${CURVE_SAMPLES - 1}), 0), 0);
    vec4 b = texelFetch(uCurve, ivec2(min(i + 1, ${CURVE_SAMPLES - 1}), 0), 0);
    vec4 c = mix(a, b, t - float(i));
    if (s < 0.0) c.x += s;
    return c;
  }

  vec3 place(vec3 q, out vec3 normal, out float s) {
    s = uNear - q.y;
    vec4 c = curveAt(s);
    normal = vec3(0.0, c.w, -c.z);
    return vec3(q.x, c.y + c.w * q.z, -(c.x + c.z * q.z));
  }
`;

const LOOK = /* glsl */ `
  uniform float uAmount;
  uniform vec3 uVoid;
  uniform float uFar;

  // Slow falloff so the far side of the roll sits back without losing its colour.
  vec3 atmosphere(vec3 color, float distanceToEye) {
    float fog = 1.0 - exp(-pow(distanceToEye / (15000.0 * uFar), 2.0));
    return mix(color, uVoid, fog * uAmount);
  }

  float grain(vec2 p) {
    return fract(sin(dot(floor(p), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  }
`;

export const paperVertex = /* glsl */ `
  ${CURVE}
  varying vec2 vUv;
  varying vec2 vPage;
  varying vec3 vNormal2;
  varying vec3 vEye;
  varying float vS;

  void main() {
    vec3 n; float s;
    vec3 world = place(position, n, s);
    vUv = uv;
    vPage = position.xy;
    vNormal2 = n;
    vEye = cameraPosition - world;
    vS = s;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const paperFragment = /* glsl */ `
  precision highp float;
  ${LOOK}
  uniform sampler2D map;
  uniform float uDim;
  uniform float uRolled;
  varying vec2 vUv;
  varying vec2 vPage;
  varying vec3 vNormal2;
  varying vec3 vEye;
  varying float vS;

  void main() {
    vec3 color;
    vec3 n = normalize(vNormal2);
    if (gl_FrontFacing) {
      color = texture(map, vUv, -0.45).rgb;
    } else {
      // The back of the sheet: a blurred ghost of the print showing through.
      color = textureLod(map, vUv, 4.0).rgb * 0.62 + 0.04;
      n = -n;
    }
    vec3 light = normalize(vec3(0.15, 0.85, 0.5));
    float shade = 0.72 + 0.28 * max(dot(n, light), 0.0);
    // Deep in the roll less light gets in.
    shade *= 1.0 - 0.42 * smoothstep(3000.0, 12000.0, vS) * uRolled;
    color *= mix(1.0, shade, uAmount);
    color += grain(vPage * 1.4) * 0.018 * uAmount;
    color = atmosphere(color, length(vEye));
    gl_FragColor = vec4(color * uDim, 1.0);
  }
`;

export const groundVertex = /* glsl */ `
  ${CURVE}
  varying vec2 vPage;
  varying vec3 vEye;
  varying float vS;

  void main() {
    vec3 n; float s;
    vec3 world = place(position, n, s);
    vPage = position.xy;
    vEye = cameraPosition - world;
    vS = s;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const groundFragment = /* glsl */ `
  precision highp float;
  ${LOOK}
  uniform float uGround;
  varying vec2 vPage;
  varying vec3 vEye;
  varying float vS;

  float gridLine(vec2 p, float size) {
    vec2 fw = max(fwidth(p), vec2(0.0001));
    vec2 q = abs(fract(p / size - 0.5) - 0.5) * size;
    return 1.0 - min(min(q.x / fw.x, q.y / fw.y), 1.0);
  }

  void main() {
    float d = length(vEye);
    float near = 1.0 - smoothstep(2500.0, 11000.0, d);
    float minor = gridLine(vPage, 100.0) * 0.07;
    float major = gridLine(vPage, 500.0) * 0.17;
    vec3 color = uVoid + vec3(0.96, 0.92, 0.84) * (minor + major) * near;
    color += grain(vPage * 0.7) * 0.012;
    gl_FragColor = vec4(mix(uVoid, color, uGround), 1.0);
  }
`;

export const plinthVertex = /* glsl */ `
  ${CURVE}
  uniform float uLift;
  attribute float aSide;
  varying vec2 vUv;
  varying vec3 vEye;
  varying float vSide;
  varying vec2 vPx;
  uniform vec2 uSize;

  void main() {
    vec3 n; float s;
    vec3 world = place(vec3(position.xy, 0.6 + position.z * uLift), n, s);
    vUv = uv;
    vSide = aSide;
    vPx = uv * uSize;
    vEye = cameraPosition - world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const plinthFragment = /* glsl */ `
  precision highp float;
  ${LOOK}
  uniform sampler2D map;
  uniform vec3 uWall;
  uniform vec2 uSize;
  varying vec2 vUv;
  varying vec3 vEye;
  varying float vSide;
  varying vec2 vPx;

  void main() {
    vec3 color;
    if (vSide < 0.5) {
      color = texture(map, vUv, -0.5).rgb;
    } else {
      // Wall: shaded by which way it faces, with one drafted line along the base.
      color = uWall * vSide;
    }
    gl_FragColor = vec4(atmosphere(color, length(vEye)), 1.0);
  }
`;

export const shadowVertex = /* glsl */ `
  ${CURVE}
  uniform vec2 uOffset;
  varying vec2 vUv;
  varying float vS;

  void main() {
    vec3 n; float s;
    vec3 world = place(vec3(position.xy + uOffset * position.z, 1.2), n, s);
    vUv = uv;
    vS = s;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const shadowFragment = /* glsl */ `
  precision highp float;
  uniform vec2 uSize;
  uniform float uSoft;
  uniform float uStrength;
  varying vec2 vUv;
  varying float vS;

  void main() {
    vec2 p = abs(vUv - 0.5) * uSize;
    vec2 edge = 0.5 * uSize - p;
    float a = smoothstep(0.0, uSoft, edge.x) * smoothstep(0.0, uSoft, edge.y);
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uStrength * (1.0 - smoothstep(2500.0, 6500.0, vS)));
  }
`;

export const extrudeVertex = /* glsl */ `
  ${CURVE}
  uniform float uDepth;
  attribute float aLayer;
  varying vec2 vUv;
  varying vec3 vEye;
  varying float vLayer;

  void main() {
    vec3 n; float s;
    vec3 world = place(vec3(position.xy, 0.8 + aLayer * uDepth), n, s);
    vUv = uv;
    vLayer = aLayer;
    vEye = cameraPosition - world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const extrudeWallFragment = /* glsl */ `
  precision highp float;
  ${LOOK}
  uniform sampler2D map;
  uniform vec3 uWall;
  varying vec2 vUv;
  varying vec3 vEye;
  varying float vLayer;

  void main() {
    if (texture(map, vUv).a < 0.5) discard;
    vec3 color = uWall * mix(0.62, 1.0, vLayer);
    gl_FragColor = vec4(atmosphere(color, length(vEye)), 1.0);
  }
`;

export const extrudeFaceFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D map;
  varying vec2 vUv;

  void main() {
    vec4 color = texture(map, vUv, -0.4);
    if (color.a < 0.01) discard;
    // The texture is premultiplied, the blend mode below expects that.
    gl_FragColor = color;
  }
`;

export const extrudeShadowVertex = /* glsl */ `
  ${CURVE}
  uniform vec2 uOffset;
  varying vec2 vUv;
  varying float vS;

  void main() {
    vec3 n; float s;
    vec3 world = place(vec3(position.xy + uOffset, 1.1), n, s);
    vUv = uv;
    vS = s;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const extrudeShadowFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D map;
  uniform float uStrength;
  varying vec2 vUv;
  varying float vS;

  void main() {
    // A high mip of the glyphs is a cheap blur.
    float a = textureLod(map, vUv, 3.5).a;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uStrength * (1.0 - smoothstep(2500.0, 6000.0, vS)));
  }
`;

export const lineVertex = /* glsl */ `
  ${CURVE}
  uniform float uGrowFrom;
  uniform float uFar;
  attribute float aBright;
  varying float vAlpha;

  void main() {
    vec3 n; float s;
    float grow = uGrowFrom < 0.0 ? 1.0 : smoothstep(-uGrowFrom, uGrowFrom, s + uGrowFrom * 0.4);
    vec3 q = vec3(position.xy, position.z * grow);
    vec3 world = place(q, n, s);
    float d = length(cameraPosition - world);
    vAlpha = aBright * (1.0 - smoothstep(4500.0 * uFar, 14000.0 * uFar, d)) * smoothstep(-900.0, -300.0, s);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const lineFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
  }
`;
