uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;

// Simple noise function
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n = p.x + p.y * 57.0 + 113.0 * p.z;
  return mix(
    mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
        mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
}

void main() {
  vec2 uv = vUv;

  // Animated noise
  float n = noise(vec3(vPosition.xy * 2.0, uTime * 0.3));

  // Color gradient based on position and time
  vec3 color1 = vec3(0.5, 0.0, 0.8); // Purple
  vec3 color2 = vec3(0.0, 0.5, 1.0); // Cyan
  vec3 color = mix(color1, color2, n);

  // Add some glow
  float glow = pow(n, 2.0);
  color += glow * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
