export const bgVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bgFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Near-black base with non-radial lift. Avoid circular falloffs here:
    // in a dark scene they quantize into visible concentric bands.
    vec3 col = vec3(0.004, 0.004, 0.004);

    vec2 cc = vUv - 0.5;
    float verticalLift = smoothstep(0.98, 0.18, vUv.y);
    float leftLift = smoothstep(1.0, 0.0, vUv.x) * smoothstep(0.0, 0.85, vUv.y);
    col += vec3(0.018) * verticalLift;
    col += vec3(0.010) * leftLift;

    // Edge darkening without a circular distance field.
    vec2 edge = smoothstep(vec2(0.18), vec2(0.62), abs(cc));
    col *= 1.0 - max(edge.x * 0.55, edge.y * 0.48);

    // Tiny spatial dither prevents low-light radial gradients from banding.
    col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;
