attribute vec3 position;
attribute vec2 uvVelocity;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform vec2 resolution;
uniform float pixelRatio;
uniform sampler2D acceleration;
uniform sampler2D velocity;

varying vec3 vColor;
varying float vOpacity;

void main() {
  vec3 a = texture2D(acceleration, uvVelocity).xyz;
  vec3 v = texture2D(velocity, uvVelocity).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(v, 1.0);

  // Define the point size.
  float distanceFromCamera = length(mvPosition.xyz);
  float pointSize = 8.0 * resolution.y / 1024.0 * pixelRatio * 50.0 / distanceFromCamera;

  vColor = abs(a) * 0.6 + 0.6;
  vOpacity = clamp(length(a) * 2.0, 0.3, 1.0);

  gl_PointSize = max(pointSize, 2.0);
  gl_Position = projectionMatrix * mvPosition;
}
