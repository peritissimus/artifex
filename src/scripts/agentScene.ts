import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ── Colors ──
const COLORS = {
  bg: '#050605',
  cream: '#C9C8BD',
  amber: '#F0A95D',
  comment: 'rgba(201,200,189,0.28)',
  key: 'rgba(201,200,189,0.92)',
  value: '#F0A95D',
  string: '#F0A95D',
  method: '#6FB7FF',
  out: 'rgba(201,200,189,0.72)',
  inLine: 'rgba(201,200,189,0.36)',
  err: '#FF8B7A',
} as const;

type TokenColor = keyof typeof COLORS;
type Token = { t: string; c?: TokenColor; b?: boolean };
type Line = Token[];

const CODE_LINES: Line[] = [
  [{ t: '# /llms.txt', c: 'comment' }],
  [{ t: 'project', c: 'key' }, { t: ': ' }, { t: 'peritissimus', c: 'value' }],
  [{ t: 'version', c: 'key' }, { t: ': ' }, { t: '1.23', c: 'value' }],
  [
    { t: 'summary', c: 'key' },
    { t: ': ' },
    { t: 'A continuous surface for engineering AI products, systems, and interfaces.', c: 'cream' },
  ],
  [],
  [{ t: '# Schema.org/Person', c: 'comment' }],
  [{ t: 'name', c: 'key' }, { t: ': ' }, { t: '"Kushal Patankar"', c: 'string' }],
  [{ t: 'jobTitle', c: 'key' }, { t: ': ' }, { t: '"Founding Engineer"', c: 'string' }],
  [{ t: 'worksFor', c: 'key' }, { t: ': ' }, { t: '"Zoca"', c: 'string' }],
  [],
  [{ t: '# MCP server', c: 'comment' }],
  [{ t: 'endpoint', c: 'key' }, { t: ': ' }, { t: 'https://peritissimus.dev/mcp', c: 'value' }],
  [{ t: 'transport', c: 'key' }, { t: ': ' }, { t: 'sse', c: 'value' }],
  [
    { t: 'tools', c: 'key' },
    { t: ': [' },
    { t: 'whoami', c: 'string' },
    { t: ', ' },
    { t: 'work', c: 'string' },
    { t: ', ' },
    { t: 'contact', c: 'string' },
    { t: ']' },
  ],
];

// ── Tweakable params ──
export interface AgentParams {
  curve: number; // barrel curve at bottom 0..1
  tilt: number; // baseline tilt back 0..1
  parallax: number; // mouse parallax 0..3
  vignette: number; // vignette darkness 0..1
  glow: number; // amber halo behind terminal 0..2
  fontSize: number;
  lineHeight: number;
  opacity: number;
  accent: string;
  bloom: number; // amber phosphor bloom 0..2
  scanlines: number; // CRT horizontal scanlines 0..1
  grain: number; // film grain / signal noise 0..1
  flicker: number; // global brightness flicker 0..1
  crt: number; // overall CRT barrel distortion 0..0.4
}

export const DEFAULT_PARAMS: AgentParams = {
  curve: 0.08,
  tilt: 0.02,
  parallax: 1,
  vignette: 0.48,
  glow: 0.72,
  fontSize: 18,
  lineHeight: 1.45,
  opacity: 1,
  accent: '#6FB7FF',
  bloom: 0.72,
  scanlines: 0.035,
  grain: 0.1,
  flicker: 0.12,
  crt: 0.05,
};

// ── Commands ──
type CommandFn = () => string | string[];
const COMMANDS: Record<string, CommandFn> = {
  help: () => [
    'available commands:',
    '',
    '  whoami      quick intro',
    '  about       longer bio',
    '  work        career timeline',
    '  stack       tech specs',
    '  contact     get in touch',
    '  github      open github',
    '  linkedin    open linkedin',
    '  resume      open resume',
    '  blog        open blog',
    '  clear       clear screen',
  ],
  whoami: () => 'kushal patankar · founding engineer @ zoca · bengaluru, in',
  about: () => [
    'kushal patankar',
    '────────────────',
    'founding engineer & system architect.',
    'currently building next-gen ai products at zoca.',
    '',
    'previously dubverse, brihaspati, simplesound.',
    'iit kharagpur · 4+ companies built · 0→1 specialist.',
  ],
  work: () => [
    'experience:',
    '',
    '  zoca         · founding engineer    · nov 2024 — now',
    '  dubverse     · senior engineer      · ai-driven media',
    '  brihaspati   · founding engineer    · enterprise saas',
    '  simplesound  · founding engineer    · audio tooling',
  ],
  stack: () => [
    'frontend     react · next · typescript · scss',
    'backend      python · django · fastapi · nestjs · node',
    'data         postgres · redis · prisma',
    'infra        aws · gcp · docker · terraform · gh actions',
    'mobile       flutter · dart · firebase',
  ],
  contact: () => [
    'email      149.kush@gmail.com',
    'github     github.com/peritissimus',
    'linkedin   linkedin.com/in/peritissimus',
    'location   bengaluru, ka, india',
  ],
  github: () => {
    window.open('https://github.com/peritissimus', '_blank', 'noopener');
    return 'opening github.com/peritissimus →';
  },
  linkedin: () => {
    window.open('https://linkedin.com/in/peritissimus', '_blank', 'noopener');
    return 'opening linkedin.com/in/peritissimus →';
  },
  blog: () => {
    window.location.href = '/blog';
    return 'navigating to /blog →';
  },
  resume: () => {
    window.open('/resume.pdf', '_blank', 'noopener');
    return 'opening resume.pdf →';
  },
  ls: () => 'about  work  stack  contact  github  linkedin  resume  blog',
  pwd: () => '/home/agent/peritissimus',
  date: () => new Date().toString(),
  exit: () => 'cannot exit · this is home.',
};

// ── Scene ──
export class AgentScene {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private bgMesh!: THREE.Mesh;
  private bgMaterial!: THREE.ShaderMaterial;
  private texCanvas = document.createElement('canvas');
  private texCtx: CanvasRenderingContext2D;
  private texture!: THREE.CanvasTexture;
  private container: HTMLElement;
  private mobileInput?: HTMLInputElement;
  private params: AgentParams;

  // Mouse parallax
  private targetMx = 0;
  private targetMy = 0;
  private mx = 0;
  private my = 0;

  // Terminal state
  private input = '';
  private histArr: string[] = [];
  private histIdx = -1;
  private outLines: Array<{ text: string; kind: 'out' | 'in' | 'err' }> = [];
  private cursorOn = true;
  private blinkTimer = 0;

  private dprScale = 2; // texture oversample for crisper text
  private raf = 0;
  private startTime = performance.now();
  private resizeObs: ResizeObserver;
  private dirty = true;

  constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    params: Partial<AgentParams> = {},
    mobileInput?: HTMLInputElement
  ) {
    this.container = container;
    this.mobileInput = mobileInput;
    this.params = { ...DEFAULT_PARAMS, ...params };

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      this.bloomStrength(this.params.bloom),
      0.34,
      0.32
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.camera.position.set(0, 0, 4);

    this.texCtx = this.texCanvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.texCanvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.buildBg();
    this.buildMesh();
    this.attachInput();

    this.resizeObs = new ResizeObserver(() => this.handleResize());
    this.resizeObs.observe(container);
    this.handleResize();

    this.tick();
  }

  // ── Build deep background plane ──
  private buildBg() {
    this.bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime;

        float hash21(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          // Near-black base with non-radial lift. Avoid circular falloffs here:
          // in a dark scene they quantize into visible concentric bands.
          vec3 col = vec3(0.004, 0.004, 0.003);

          vec2 cc = vUv - 0.5;
          float verticalLift = smoothstep(0.98, 0.18, vUv.y);
          float leftLift = smoothstep(1.0, 0.0, vUv.x) * smoothstep(0.0, 0.85, vUv.y);
          col += vec3(0.012, 0.018, 0.021) * verticalLift;
          col += vec3(0.010, 0.008, 0.005) * leftLift;

          // Edge darkening without a circular distance field.
          vec2 edge = smoothstep(vec2(0.18), vec2(0.62), abs(cc));
          col *= 1.0 - max(edge.x * 0.55, edge.y * 0.48);

          // Tiny spatial dither prevents low-light radial gradients from banding.
          col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const bgGeom = new THREE.PlaneGeometry(20, 14, 1, 1);
    this.bgMesh = new THREE.Mesh(bgGeom, this.bgMaterial);
    this.bgMesh.position.z = -3.5;
    this.scene.add(this.bgMesh);
  }

  // ── Build the curved window plane mesh ──
  private buildMesh() {
    const geom = new THREE.PlaneGeometry(2, 2, 80, 80);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: this.texture },
        uCurve: { value: this.params.curve },
        uTilt: { value: this.params.tilt },
        uVignette: { value: this.params.vignette },
        uOpacity: { value: this.params.opacity },
        uScanlines: { value: this.params.scanlines },
        uGrain: { value: this.params.grain },
        uFlicker: { value: this.params.flicker },
        uCrt: { value: this.params.crt },
        uMx: { value: 0 },
        uMy: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uCurve;
        uniform float uTilt;
        uniform float uMx;
        uniform float uMy;

        void main() {
          vUv = uv;
          vec3 p = position;

          // uv.y: 0 bottom, 1 top
          float bottomT = 1.0 - uv.y;       // 1 at bottom, 0 at top
          float xDist = abs(uv.x - 0.5) * 2.0; // 0 center, 1 edges

          // Barrel curve — bottom edges recede (smile shape).
          // Concentrated in the lowest ~30% of the plane so the upper code stays flat.
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
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D uTex;
        uniform float uVignette;
        uniform float uOpacity;
        uniform float uScanlines;
        uniform float uGrain;
        uniform float uFlicker;
        uniform float uCrt;
        uniform float uTime;
        uniform vec2  uResolution;

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

          // Scanlines — fine horizontal lines based on screen pixels
          if (uScanlines > 0.0) {
            float lineY = gl_FragCoord.y * 0.5;
            float scan = sin(lineY * 3.14159 * 2.0) * 0.5 + 0.5;
            float scanMix = mix(1.0, 0.6 + scan * 0.4, uScanlines);
            c *= scanMix;
          }

          // Vignette
          vec2 cc = uv - 0.5;
          float d = length(cc * vec2(1.05, 1.0));
          float vig = 1.0 - smoothstep(0.30, 0.78, d) * uVignette;
          c *= vig;

          // Grain
          if (uGrain > 0.0) {
            float n = hash(uv * uResolution + uTime * 60.0) - 0.5;
            c += n * uGrain * 0.06;
          }

          // Subtle flicker
          if (uFlicker > 0.0) {
            float f = 1.0 + sin(uTime * 14.7) * 0.018 + sin(uTime * 31.3) * 0.012;
            c *= mix(1.0, f, uFlicker);
          }

          // Micro-dither smooths dark radial haze/glow bands after bloom/tone mapping.
          c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

          c *= uOpacity;
          a *= uOpacity;
          gl_FragColor = vec4(c, a);
        }
      `,
    });
    this.mesh = new THREE.Mesh(geom, this.material);
    this.scene.add(this.mesh);
  }

  // ── Resize ──
  private handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    // Resize plane to fully fill the viewport at this camera distance
    const visH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const visW = visH * aspect;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(visW, visH, 80, 80);

    // Resize texture canvas (oversample for crispness)
    this.texCanvas.width = Math.round(w * this.dprScale);
    this.texCanvas.height = Math.round(h * this.dprScale);

    // Update resolution uniform for shader-side pixel math
    this.material.uniforms.uResolution.value.set(this.texCanvas.width, this.texCanvas.height);
    this.dirty = true;
  }

  // ── Input handling ──
  private attachInput() {
    // Capture keyboard events at document level
    document.addEventListener('keydown', this.handleKey);
    this.mobileInput?.addEventListener('input', this.handleMobileInput);
    // Click on canvas focuses the hidden input on touch devices so the OS keyboard opens.
    this.container.addEventListener('pointerdown', this.handlePointerDown);
    this.container.addEventListener('pointermove', this.handlePointer);
    this.container.addEventListener('pointerleave', this.handlePointerLeave);
  }
  private handlePointerDown = () => {
    this.mobileInput?.focus({ preventScroll: true });
  };
  private handlePointer = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.targetMx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    this.targetMy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  private handlePointerLeave = () => {
    this.targetMx = 0;
    this.targetMy = 0;
  };
  private handleKey = (e: KeyboardEvent) => {
    // Ignore if typing in another input/textarea (control panel, etc.)
    const ae = document.activeElement;
    const isMobileInput = ae === this.mobileInput;
    if (
      ae &&
      !isMobileInput &&
      (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || (ae as HTMLElement).isContentEditable)
    ) {
      return;
    }

    if (isMobileInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) return;
    if (isMobileInput && e.key === 'Backspace') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isMobileInput) this.input = this.mobileInput?.value ?? this.input;
      this.runCommand(this.input);
      this.setInput('');
      this.histIdx = this.histArr.length;
      this.dirty = true;
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.setInput(this.input.slice(0, -1));
      this.dirty = true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.histArr.length === 0) return;
      this.histIdx = Math.max(0, this.histIdx - 1);
      this.setInput(this.histArr[this.histIdx] ?? '');
      this.dirty = true;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.histIdx = Math.min(this.histArr.length, this.histIdx + 1);
      this.setInput(this.histArr[this.histIdx] ?? '');
      this.dirty = true;
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.outLines = [];
      this.dirty = true;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.setInput(this.input + e.key);
      this.dirty = true;
    }
  };
  private handleMobileInput = () => {
    this.input = this.mobileInput?.value ?? '';
    this.dirty = true;
  };

  private setInput(value: string) {
    this.input = value;
    if (this.mobileInput && this.mobileInput.value !== value) this.mobileInput.value = value;
  }

  // ── Terminal logic ──
  private print(text: string, kind: 'out' | 'in' | 'err' = 'out') {
    this.outLines.push({ text, kind });
  }
  private runCommand(raw: string) {
    const trimmed = raw.trim();
    this.print(`agent@peritissimus ~ ${trimmed}`, 'in');
    if (!trimmed) return;
    this.histArr.push(trimmed);
    const [cmd, ...args] = trimmed.split(/\s+/);
    if (cmd.toLowerCase() === 'clear') {
      this.outLines = [];
      return;
    }
    if (cmd.toLowerCase() === 'echo') {
      this.print(args.join(' '));
      return;
    }
    const fn = COMMANDS[cmd.toLowerCase()];
    if (!fn) {
      this.print(`command not found: ${cmd} — try 'help'`, 'err');
      return;
    }
    const result = fn();
    if (typeof result === 'string') {
      if (result) this.print(result);
    } else {
      result.forEach((line) => this.print(line));
    }
  }

  // ── Texture drawing — floating llms.txt surface + bottom command tray ──
  private redraw() {
    const ctx = this.texCtx;
    const W = this.texCanvas.width;
    const H = this.texCanvas.height;
    const s = this.dprScale;
    const monoFamily = `ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace`;
    const cssW = W / s;
    const cssH = H / s;
    const codeFontCss = this.clamp(
      this.params.fontSize,
      cssW < 720 ? 13 : 16,
      cssW < 720 ? 16 : 22
    );
    const codeFontPx = codeFontCss * s;
    const lineH = codeFontPx * this.params.lineHeight;

    // Constrain content to a max-width column, centered.
    const MAX_CONTENT_CSS = 880;
    const colCss = Math.min(cssW, MAX_CONTENT_CSS);
    const colLeft = ((cssW - colCss) / 2) * s;
    const colWidth = colCss * s;
    const innerPadCss = this.clamp(colCss * 0.06, 18, 48);
    const padX = colLeft + innerPadCss * s;
    const codeTop = this.clamp(cssH * 0.08, 34, 78) * s;

    ctx.clearRect(0, 0, W, H);

    // — llms.txt block —
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.22)';
    ctx.shadowBlur = 7 * s;
    let y = codeTop + codeFontPx;
    for (const line of CODE_LINES) {
      let x = padX;
      for (const tok of line) {
        ctx.font = (tok.b ? '700 ' : '700 ') + `${codeFontPx}px ${monoFamily}`;
        ctx.fillStyle = tok.c ? COLORS[tok.c] : COLORS.cream;
        ctx.fillText(tok.t, x, y);
        x += ctx.measureText(tok.t).width;
      }
      y += lineH;
    }
    ctx.shadowBlur = 0;

    // — Bottom command tray (also constrained to the column) —
    const trayInsetCss = this.clamp(colCss * 0.04, 12, 28);
    const trayX = colLeft + trayInsetCss * s;
    const trayW = colWidth - trayInsetCss * s * 2;
    const trayH = this.clamp(cssH * 0.2, 132, 178) * s;
    const trayY = H - trayH - this.clamp(cssH * 0.045, 22, 44) * s;
    const trayR = 10 * s;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 38 * s;
    ctx.shadowOffsetY = 16 * s;
    ctx.fillStyle = 'rgba(3, 4, 4, 0.72)';
    this.trayPath(ctx, trayX, trayY, trayW, trayH, trayR);
    ctx.fill();
    ctx.restore();

    ctx.save();
    this.trayPath(ctx, trayX, trayY, trayW, trayH, trayR);
    ctx.clip();
    const trayGrad = ctx.createLinearGradient(0, trayY, 0, trayY + trayH);
    trayGrad.addColorStop(0, 'rgba(14, 15, 15, 0.55)');
    trayGrad.addColorStop(1, 'rgba(3, 4, 4, 0.78)');
    ctx.fillStyle = trayGrad;
    ctx.fillRect(trayX, trayY, trayW, trayH);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 1 * s;
    ctx.strokeStyle = 'rgba(201, 200, 189, 0.12)';
    this.trayPath(ctx, trayX + 0.5 * s, trayY + 0.5 * s, trayW - 1 * s, trayH - 1 * s, trayR);
    ctx.stroke();
    ctx.restore();

    const trayPadX = this.clamp(cssW * 0.02, 18, 30) * s;
    const tFontPx = this.clamp(codeFontCss * 0.82, 12, 17) * s;
    const tLineH = tFontPx * 1.45;
    const visibleOutCap = cssH < 620 ? 2 : 3;
    const visibleOut = this.outLines.slice(-visibleOutCap);
    const terminalX = trayX + trayPadX;
    const promptY = trayY + trayH - 22 * s;

    ctx.font = `700 ${tFontPx}px ${monoFamily}`;
    ctx.fillStyle = 'rgba(201, 200, 189, 0.72)';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.18)';
    ctx.shadowBlur = 5 * s;
    ctx.fillText('Peritissimus · agent shell v1.23', terminalX, trayY + 48 * s);
    ctx.font = `700 ${tFontPx * 0.9}px ${monoFamily}`;
    ctx.fillStyle = 'rgba(201, 200, 189, 0.68)';
    ctx.fillText("Type 'help' for commands, 'clear' to reset.", terminalX, trayY + 72 * s);

    let outY = promptY - tLineH * visibleOut.length - tLineH * 0.35;
    ctx.font = `${tFontPx}px ${monoFamily}`;
    for (const o of visibleOut) {
      ctx.fillStyle = o.kind === 'in' ? COLORS.inLine : o.kind === 'err' ? COLORS.err : COLORS.out;
      ctx.fillText(o.text, terminalX, outY);
      outY += tLineH;
    }

    ctx.font = `700 ${tFontPx}px ${monoFamily}`;
    ctx.fillStyle = this.params.accent;
    ctx.fillText('agent@peritissimus', terminalX, promptY);
    let px = terminalX + ctx.measureText('agent@peritissimus').width;
    ctx.fillStyle = 'rgba(201, 200, 189, 0.52)';
    ctx.fillText(' ~ ', px, promptY);
    px += ctx.measureText(' ~ ').width;
    ctx.fillStyle = 'rgba(226, 225, 214, 0.95)';
    ctx.fillText(this.input, px, promptY);
    px += ctx.measureText(this.input).width;
    if (this.cursorOn) {
      ctx.fillStyle = this.params.accent;
      ctx.fillText('▍', px, promptY);
    }
    ctx.shadowBlur = 0;

    // — Accent glow — additive, multi-stop gaussian-ish falloff for a soft
    //   diffused halo. Three stacked radii give a smoother bell than a single
    //   gradient could.
    if (this.params.glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const accent = this.hexToRgb(this.params.accent);
      const minDim = Math.min(W, H);
      const maxDim = Math.max(W, H);
      const promptCx = terminalX + (trayW - trayPadX * 2) * 0.3;
      const promptCy = promptY - tFontPx * 0.4;

      const layers: Array<{ cx: number; cy: number; r: number; peak: number }> = [
        // Tight near-source — soft peak, short reach
        { cx: promptCx, cy: promptCy, r: minDim * 0.18, peak: 0.18 },
        // Mid bloom — broader, the heart of the diffusion
        { cx: promptCx, cy: promptCy, r: minDim * 0.42, peak: 0.1 },
        // Wide ambient — fills the room
        { cx: W * 0.5, cy: trayY + trayH * 0.55, r: maxDim * 0.7, peak: 0.05 },
      ];

      for (const l of layers) {
        const g = ctx.createRadialGradient(l.cx, l.cy, 0, l.cx, l.cy, l.r);
        const p = l.peak * this.params.glow;
        // Gaussian-ish stops: ease off slowly first, then fall to zero softly
        g.addColorStop(0.0, `rgba(${accent.r},${accent.g},${accent.b}, ${p})`);
        g.addColorStop(0.2, `rgba(${accent.r},${accent.g},${accent.b}, ${p * 0.78})`);
        g.addColorStop(0.45, `rgba(${accent.r},${accent.g},${accent.b}, ${p * 0.42})`);
        g.addColorStop(0.7, `rgba(${accent.r},${accent.g},${accent.b}, ${p * 0.16})`);
        g.addColorStop(0.9, `rgba(${accent.r},${accent.g},${accent.b}, ${p * 0.04})`);
        g.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    }

    this.texture.needsUpdate = true;
    this.dirty = false;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return { r: 95, g: 224, b: 202 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  private trayPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const sag = Math.min(12 * this.dprScale, h * 0.12);
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.quadraticCurveTo(x + w / 2, y + sag, x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w - 10 * this.dprScale, y + h - rr);
    ctx.quadraticCurveTo(x + w - 10 * this.dprScale, y + h, x + w - rr - 12 * this.dprScale, y + h);
    ctx.quadraticCurveTo(x + w / 2, y + h + sag * 0.55, x + rr + 12 * this.dprScale, y + h);
    ctx.quadraticCurveTo(x + 10 * this.dprScale, y + h, x + 10 * this.dprScale, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  // ── Animation loop ──
  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);

    const t = (performance.now() - this.startTime) / 1000;
    this.material.uniforms.uTime.value = t;
    this.bgMaterial.uniforms.uTime.value = t;

    // Smooth mouse
    this.mx += (this.targetMx - this.mx) * 0.06;
    this.my += (this.targetMy - this.my) * 0.06;

    // Camera parallax — drives true 3D depth between bg + window
    this.camera.position.x = this.mx * 0.45 * this.params.parallax;
    this.camera.position.y = -this.my * 0.3 * this.params.parallax;
    this.camera.lookAt(0, 0, 0);

    // Slight extra tilt on window plane via shader
    this.material.uniforms.uMx.value = this.mx * this.params.parallax * 0.4;
    this.material.uniforms.uMy.value = this.my * this.params.parallax * 0.4;

    // Cursor blink
    this.blinkTimer += 16;
    if (this.blinkTimer > 530) {
      this.blinkTimer = 0;
      this.cursorOn = !this.cursorOn;
      this.dirty = true;
    }

    if (this.dirty) this.redraw();

    this.composer.render();
  };

  // ── Public: parameter updates ──
  setParam<K extends keyof AgentParams>(k: K, v: AgentParams[K]) {
    this.params[k] = v;
    const u = this.material.uniforms;
    if (k === 'curve') u.uCurve.value = v as number;
    if (k === 'tilt') u.uTilt.value = v as number;
    if (k === 'vignette') u.uVignette.value = v as number;
    if (k === 'bloom') this.bloomPass.strength = this.bloomStrength(v as number);
    if (k === 'opacity') u.uOpacity.value = v as number;
    if (k === 'scanlines') u.uScanlines.value = v as number;
    if (k === 'grain') u.uGrain.value = v as number;
    if (k === 'flicker') u.uFlicker.value = v as number;
    if (k === 'crt') u.uCrt.value = v as number;
    if (k === 'fontSize' || k === 'lineHeight' || k === 'glow' || k === 'accent') this.dirty = true;
  }

  getParams(): AgentParams {
    return { ...this.params };
  }

  private bloomStrength(value: number) {
    return Math.max(0, value) * 0.9;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    document.removeEventListener('keydown', this.handleKey);
    this.container.removeEventListener('pointermove', this.handlePointer);
    this.container.removeEventListener('pointerleave', this.handlePointerLeave);
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.bgMaterial.dispose();
    this.bgMesh.geometry.dispose();
    this.texture.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
