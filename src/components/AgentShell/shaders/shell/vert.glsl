varying vec2 vUv;
uniform float uCurve;
uniform vec2  uMouse;

void main() {
  vUv = uv;
  vec3 p = position;

  // Barrel curve at the bottom — concentrated in the lowest 30% so the
  // upper part of the window stays flat. Mild "smile" at the corners.
  float bottomT = 1.0 - uv.y;
  float xDist = abs(uv.x - 0.5) * 2.0;
  float bottomMask = pow(bottomT, 2.6);
  p.z -= bottomMask * pow(xDist, 1.6) * uCurve * 0.7;

  // Slight constant tilt back so the top recedes. Subtle perspective hint.
  p.z -= (1.0 - uv.y) * 0.015;

  // Mouse parallax — small additional plane offset on top of camera move,
  // gives the plane a sense of weight separate from the bg.
  p.x += uMouse.x * 0.025;
  p.y -= uMouse.y * 0.020;
  p.z += uMouse.x * 0.012 - uMouse.y * 0.010;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
