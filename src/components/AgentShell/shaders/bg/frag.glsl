varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uVignette;
uniform float uGrain;
uniform float uFlicker;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 sp = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;

  // — Room base (neutral dark gradient, biased toward bottom and left) —
  vec3 col = vec3(0.005);

  vec2 cc = vUv - 0.5;
  float verticalLift = smoothstep(0.98, 0.18, vUv.y);
  float leftLift = smoothstep(1.0, 0.0, vUv.x) * smoothstep(0.0, 0.85, vUv.y);
  col += vec3(0.022) * verticalLift;
  col += vec3(0.012) * leftLift;

  // Edge darkening — non-circular so dark scenes don't band.
  vec2 edge = smoothstep(vec2(0.18), vec2(0.62), abs(cc));
  col *= 1.0 - max(edge.x * 0.55, edge.y * 0.48);

  // — Vignette (room edges) —
  if (uVignette > 0.0) {
    float v = length((sp - 0.5) * vec2(aspect, 1.0));
    float vig = 1.0 - smoothstep(0.45 / aspect, 1.05, v) * uVignette;
    col *= vig;
  }

  // — Flicker (slow + fast harmonics, room-wide) —
  if (uFlicker > 0.0) {
    float f = 1.0 + sin(uTime * 14.7) * 0.018 + sin(uTime * 31.3) * 0.012;
    col *= mix(1.0, f, uFlicker);
  }

  // — Grain — animated per-pixel noise.
  if (uGrain > 0.0) {
    float n = hash21(gl_FragCoord.xy + uTime * 60.0) - 0.5;
    col += n * uGrain * 0.05;
  }

  // Spatial dither against banding in the dark gradient.
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
