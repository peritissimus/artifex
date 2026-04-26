export const planeVertex = /* glsl */ `
  varying vec2 vUv;
  uniform float uCurve;
  uniform float uTilt;
  uniform float uMx;
  uniform float uMy;

  void main() {
    vUv = uv;
    vec3 p = position;

    // uv.y: 0 bottom, 1 top
    float bottomT = 1.0 - uv.y;          // 1 at bottom, 0 at top
    float xDist = abs(uv.x - 0.5) * 2.0; // 0 center, 1 edges

    // Barrel curve — bottom edges recede (smile shape).
    // Concentrated in the lowest ~30% of the plane.
    float bottomMask = pow(bottomT, 2.6);
    float curve = bottomMask * pow(xDist, 1.6) * uCurve * 2.2;
    p.z -= curve;

    // Slight tilt back: top recedes overall (perspective)
    p.z -= (1.0 - uv.y) * uTilt * 0.6;

    // Mouse parallax — tilt the plane
    p.x += uMx * 0.05;
    p.y -= uMy * 0.04;
    p.z += uMx * 0.02 - uMy * 0.015;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const planeFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uVignette;
  uniform float uOpacity;
  uniform float uGrain;
  uniform float uFlicker;
  uniform float uCrt;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uBodyMin;
  uniform vec2  uBodyMax;

  // Hash for grain noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // CRT barrel distortion on UV — concentrates curvature at corners
  vec2 crtUV(vec2 uv, float amount) {
    vec2 cc = uv - 0.5;
    float r2 = dot(cc, cc);
    return uv + cc * r2 * amount;
  }

  // Body region mask — 1 inside the terminal body, 0 outside.
  float bodyMask(vec2 uv) {
    vec2 lo = step(uBodyMin, uv);
    vec2 hi = step(uv, uBodyMax);
    return lo.x * lo.y * hi.x * hi.y;
  }

  void main() {
    // CRT barrel distortion (subtle on whole image)
    vec2 uv = mix(vUv, crtUV(vUv, 1.0), clamp(uCrt * 4.0, 0.0, 1.0) * 0.6);

    // Out-of-bounds → fully transparent (lets bg show through)
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      discard;
    }

    vec4 src = texture2D(uTex, uv);
    vec3 c = src.rgb;
    float a = src.a;

    // Vignette
    vec2 cc = uv - 0.5;
    float d = length(cc * vec2(1.05, 1.0));
    float vig = 1.0 - smoothstep(0.30, 0.78, d) * uVignette;
    c *= vig;

    // Grain + flicker only inside the terminal body region.
    float inBody = bodyMask(uv);

    if (uGrain > 0.0) {
      float n = hash(uv * uResolution + uTime * 60.0) - 0.5;
      c += n * uGrain * 0.06 * inBody;
    }

    if (uFlicker > 0.0) {
      float f = 1.0 + sin(uTime * 14.7) * 0.018 + sin(uTime * 31.3) * 0.012;
      c *= mix(1.0, f, uFlicker * inBody);
    }

    // Micro-dither smooths dark radial haze/glow bands after bloom/tone mapping.
    c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

    c *= uOpacity;
    a *= uOpacity;
    gl_FragColor = vec4(c, a);
  }
`;
