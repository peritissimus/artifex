varying vec2 vUv;
uniform sampler2D uTex;
uniform float uOpacity;
uniform float uLensWarp;

// Subtle barrel distortion on the texture sample — concentrates curvature
// at corners so the screen content reads as projected onto curved glass.
vec2 lensUV(vec2 uv, float amount) {
  vec2 cc = uv - 0.5;
  float r2 = dot(cc, cc);
  return uv + cc * r2 * amount;
}

void main() {
  vec2 uv = mix(vUv, lensUV(vUv, 1.0), clamp(uLensWarp * 4.0, 0.0, 1.0) * 0.6);

  // Discard out-of-bounds samples so the shell shape is preserved
  // (lens warp can push uv outside the rect at corners).
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

  vec4 src = texture2D(uTex, uv);
  if (src.a < 0.001) discard;

  gl_FragColor = vec4(src.rgb * uOpacity, src.a * uOpacity);
}
