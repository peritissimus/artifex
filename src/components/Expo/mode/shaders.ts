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
  uniform float uVelocity;
  uniform vec3 uTint;
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
    float minor = gridLine(vPage, 100.0) * 0.08;
    float major = gridLine(vPage, 500.0) * 0.24;
    // The lines running your way brighten as you pick up speed.
    float fx = max(fwidth(vPage.x), 0.0001);
    float rail = 1.0 - min(abs(fract(vPage.x / 500.0 - 0.5) - 0.5) * 500.0 / fx, 1.0);
    float rush = rail * min(0.5, abs(uVelocity) / 4200.0);
    vec3 ink = mix(vec3(0.96, 0.92, 0.84), uTint, 0.62);
    vec3 color = uVoid + ink * (minor + major + rush) * near;
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

// A heading is copied with the paper behind it, but every pixel is a blend of exactly two known
// colours, so how much ink is in it can be solved for. That's the glyph's alpha, edges and all.
const KEY = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uStock;

  float inkIn(vec3 color) {
    vec3 span = uInk - uStock;
    return clamp(dot(color - uStock, span) / dot(span, span), 0.0, 1.0);
  }
`;

export const extrudeWallFragment = /* glsl */ `
  precision highp float;
  ${LOOK}
  ${KEY}
  uniform sampler2D map;
  uniform vec3 uWall;
  varying vec2 vUv;
  varying vec3 vEye;
  varying float vLayer;

  void main() {
    if (inkIn(texture(map, vUv).rgb) < 0.5) discard;
    vec3 color = uWall * mix(0.62, 1.0, vLayer);
    gl_FragColor = vec4(atmosphere(color, length(vEye)), 1.0);
  }
`;

export const extrudeFaceFragment = /* glsl */ `
  precision highp float;
  ${KEY}
  uniform sampler2D map;
  varying vec2 vUv;

  void main() {
    float a = inkIn(texture(map, vUv, -0.4).rgb);
    if (a < 0.01) discard;
    // Premultiplied, as the blend mode expects.
    gl_FragColor = vec4(uInk * a, a);
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
  ${KEY}
  uniform sampler2D map;
  uniform float uStrength;
  varying vec2 vUv;
  varying float vS;

  void main() {
    // A high mip of the glyphs is a cheap blur.
    float a = inkIn(textureLod(map, vUv, 3.5).rgb);
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uStrength * (1.0 - smoothstep(2500.0, 6000.0, vS)));
  }
`;

export const lineVertex = /* glsl */ `
  ${CURVE}
  uniform float uFar;
  attribute float aBright;
  varying float vAlpha;

  void main() {
    vec3 n; float s;
    vec3 world = place(position, n, s);
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

// The line work. Each segment carries the end it starts from, so it can grow out of there.
const WIRE = /* glsl */ `
  uniform float uFar;
  uniform float uReveal;
  uniform float uRolled;
  uniform float uCurveStart;
  uniform float uWires;
  uniform float uStand;
  uniform vec3 uCursor;
  attribute vec3 aAnchor;
  attribute vec3 aTint;
  attribute vec2 aLook;
  varying vec3 vTint;
  varying float vAlpha;

  // Everything tall lies down on its way into the roll, where there's no room to stand. And all of
  // it grows up out of the ground as the page lifts into the world.
  vec3 settle(vec3 q) {
    float s = uNear - q.y;
    q.z *= uStand * uWires * (1.0 - 0.9 * uRolled * smoothstep(uCurveStart + 300.0, uCurveStart + 2400.0, s));
    return q;
  }

  // How much of this segment has been drawn by now. Things sketch themselves in as they arrive.
  float drawn(float seed) {
    float s = uNear - aAnchor.y;
    float from = -300.0 + seed * 640.0;
    return mix(1.0, smoothstep(from, from + 320.0, s), uReveal);
  }

  void shade(vec3 q, vec3 world, float s, float r) {
    float d = length(cameraPosition - world);
    float fade = 1.0 - smoothstep(3600.0 * uFar, 12500.0 * uFar, d);
    float lens = smoothstep(60.0, 380.0, d);
    float glow = uCursor.z * (1.0 - smoothstep(120.0, 720.0, distance(q.xy, uCursor.xy)));
    vTint = mix(aTint, vec3(1.0), glow * 0.85);
    vAlpha = (aLook.x + glow * 0.6) * fade * lens * uWires * step(0.001, r) * smoothstep(-1300.0, -900.0, s);
  }
`;

export const hairVertex = /* glsl */ `
  ${CURVE}
  ${WIRE}

  void main() {
    float r = drawn(aLook.y);
    vec3 q = settle(mix(aAnchor, position, r));
    vec3 n; float s;
    vec3 world = place(q, n, s);
    shade(q, world, s, r);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const fatVertex = /* glsl */ `
  ${CURVE}
  ${WIRE}
  uniform vec2 uPixel;
  uniform float uWidth;
  uniform float uHead;
  attribute vec2 aCorner;

  void main() {
    float r = drawn(aLook.y);
    vec3 qa = settle(aAnchor);
    vec3 qb = settle(mix(aAnchor, position, r));
    vec3 n; float sa; float sb;
    vec3 wa = place(qa, n, sa);
    vec3 wb = place(qb, n, sb);
    mat4 pv = projectionMatrix * viewMatrix;
    vec4 ca = pv * vec4(wa, 1.0);
    vec4 cb = pv * vec4(wb, 1.0);

    // A line behind the eye has no screen direction: pull its end up to the eye first.
    const float EYE = 1.0;
    if (ca.w < EYE && cb.w < EYE) {
      vTint = aTint;
      vAlpha = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    if (ca.w < EYE) ca = mix(ca, cb, (EYE - ca.w) / (cb.w - ca.w));
    if (cb.w < EYE) cb = mix(cb, ca, (EYE - cb.w) / (ca.w - cb.w));

    vec2 pa = ca.xy / ca.w / uPixel;
    vec2 pb = cb.xy / cb.w / uPixel;
    vec2 dir = pb - pa;
    float len = length(dir);
    dir = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
    vec2 normal = vec2(-dir.y, dir.x);

    bool atEnd = aCorner.x > 0.5;
    vec4 c = atEnd ? cb : ca;
    c.xy += normal * aCorner.y * uWidth * 0.5 * uPixel * c.w;
    gl_Position = c;

    shade(atEnd ? qb : qa, atEnd ? wb : wa, atEnd ? sb : sa, r);
    // The pen line only exists as far as the pen has got. Its seed is its place along the line.
    vAlpha *= step(aLook.y, uHead);
  }
`;

export const wireFragment = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  varying vec3 vTint;
  varying float vAlpha;

  void main() {
    float a = vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vTint, a);
  }
`;

export const moteVertex = /* glsl */ `
  ${CURVE}
  uniform float uVelocity;
  uniform float uTime;
  uniform float uWires;
  uniform vec3 uTint;
  attribute float aEnd;
  attribute float aPhase;
  varying vec3 vTint;
  varying float vAlpha;

  void main() {
    float speed = abs(uVelocity);
    vec3 q = position;
    // Ticks at rest, streaks at speed, always along the way you're travelling.
    q.y += (aEnd - 0.5) * (16.0 + speed * 0.17);
    q.z *= uWires;
    vec3 n; float s;
    vec3 world = place(q, n, s);
    float d = length(cameraPosition - world);
    float twinkle = 0.62 + 0.38 * sin(uTime * 1.3 + aPhase);
    vAlpha = (0.24 * twinkle + min(0.62, speed / 2400.0)) * uWires
      * smoothstep(90.0, 520.0, d) * (1.0 - smoothstep(1900.0, 6800.0, d)) * smoothstep(-1250.0, -950.0, s);
    vTint = mix(vec3(0.96, 0.93, 0.86), uTint, 0.55);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const moteFragment = /* glsl */ `
  precision highp float;
  varying vec3 vTint;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vTint, vAlpha);
  }
`;

export const squareVertex = /* glsl */ `
  ${CURVE}
  uniform vec3 uCursor;
  uniform float uCursorLift;
  varying float vAlpha;

  void main() {
    vec3 n; float s;
    vec3 world = place(vec3(uCursor.xy + position.xy, 3.0 + uCursorLift), n, s);
    vAlpha = uCursor.z * 0.56 * (1.0 - smoothstep(0.0, 2400.0, length(position.xy)));
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const squareFragment = /* glsl */ `
  precision highp float;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vec3(vAlpha), 1.0);
  }
`;

export const plainVertex = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
  }
`;

export const plainFragment = /* glsl */ `
  precision highp float;
  uniform float uOpacity;

  void main() {
    gl_FragColor = vec4(0.96, 0.93, 0.86, uOpacity);
  }
`;
