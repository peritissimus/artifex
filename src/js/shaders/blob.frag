uniform sampler2D noiseTexture;
uniform float time;
uniform vec2 resolution;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Calculate screen-space UV for background sampling
  vec2 screenUV = gl_FragCoord.xy / resolution;

  // Normal-based refraction distortion
  vec3 normal = normalize(vNormal);
  float refractionStrength = 0.4;
  vec2 refraction = normal.xy * refractionStrength;

  // Additional lens distortion based on distance from center
  vec2 center = vec2(0.5, 0.5);
  vec2 toCenter = vUv - center;
  float dist = length(toCenter) * 2.0;

  // Combine refraction with lens bulge
  float lensEffect = 0.25 * (1.0 - dist * dist);
  vec2 totalDistortion = refraction + toCenter * lensEffect;

  // Add zoom/magnification effect
  vec2 zoomedUV = screenUV + totalDistortion;
  vec2 centerOffset = zoomedUV - vec2(0.5);
  float zoomFactor = 0.85; // <1.0 = zoom in
  zoomedUV = vec2(0.5) + centerOffset * zoomFactor;

  // Sample background with distortion and zoom
  vec3 noiseColor = texture2D(noiseTexture, zoomedUV * 0.3).rgb;

  // Fresnel for glassy rim
  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
  float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 3.0);

  // Glass tint
  vec3 glassTint = vec3(0.9, 0.92, 0.95);

  // Build color with distorted background
  vec3 color = noiseColor * 1.8;

  // Glass shine/reflection
  color += fresnel * vec3(0.5, 0.55, 0.6);

  // Apply tint
  color *= glassTint;

  // Rim lighting
  float rim = smoothstep(0.6, 1.0, dist);
  color += rim * vec3(0.2, 0.25, 0.3) * fresnel;

  // Very transparent like water - mostly see-through with bright edges
  float alpha = 0.15 + fresnel * 0.35;

  gl_FragColor = vec4(color, alpha);
}
