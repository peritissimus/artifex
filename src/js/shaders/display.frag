uniform sampler2D noise;
uniform float time;
uniform float ease;
uniform float alpha;
uniform float distA;
uniform float distB;

varying vec2 vUv;

void main() {
  vec3 noiseC = texture2D(noise, vec2(vUv.x * 0.3, vUv.y * 0.3)).rgb;

  vec2 ppp = -1.0 + 2.0 * vUv;

  float wscale = 1.6;

  // Create wave distortions (matching homunculus.jp)
  ppp += 0.1 * cos((1.5 * wscale) * ppp.yx + 1.1 * time + vec2(0.1, 1.1));
  ppp += 0.1 * cos((2.3 * wscale) * ppp.yx + 1.3 * time + vec2(3.2, 3.4));
  ppp += 0.1 * cos((2.2 * wscale) * ppp.yx + 1.7 * time + vec2(1.8, 5.2));
  ppp += distA * cos((distB * wscale) * ppp.yx + 1.4 * time + vec2(6.3, 3.9));

  float r = length(ppp);

  float vx = (vUv.x * ease) + (r * (1.0 - ease));
  float vy = (vUv.y * ease) + (0.0 * (1.0 - ease));

  // Sample noise with distorted UV
  vec3 distortedNoise = texture2D(noise, vec2(vx * 0.3, vy * 0.3)).rgb;

  // Create subtle gradient effect based on noise
  float noiseVal = (distortedNoise.r + noiseC.r) * 0.5;

  // More visible gray coloring with variation
  vec3 color = vec3(noiseVal * 0.4);

  float aa = alpha - (noiseC.r * 0.3 * (1.0 - ease));

  gl_FragColor = vec4(color, aa);
}
