// The wireframe buildings along the ribbon. Each is a little architectural joke about its project,
// written as raw line segments in (x, along the page, up) so the curve can carry them with the paper.

type Segments = number[];
type Point = [number, number, number];

const line = (out: Segments, a: Point, b: Point) => out.push(...a, ...b);

function polyline(out: Segments, points: Point[], closed = false) {
  for (let i = 0; i < points.length - 1; i++) line(out, points[i], points[i + 1]);
  if (closed) line(out, points[points.length - 1], points[0]);
}

function box(out: Segments, x: number, y: number, z: number, w: number, d: number, h: number) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const y0 = y - d / 2;
  const y1 = y + d / 2;
  const z1 = z + h;
  polyline(
    out,
    [
      [x0, y0, z],
      [x1, y0, z],
      [x1, y1, z],
      [x0, y1, z],
    ],
    true
  );
  polyline(
    out,
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    true
  );
  line(out, [x0, y0, z], [x0, y0, z1]);
  line(out, [x1, y0, z], [x1, y0, z1]);
  line(out, [x1, y1, z], [x1, y1, z1]);
  line(out, [x0, y1, z], [x0, y1, z1]);
}

/** A horizontal ring. */
function ring(out: Segments, x: number, y: number, z: number, r: number, n = 28) {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z]);
  }
  polyline(out, pts, true);
}

function cylinder(
  out: Segments,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  n = 20,
  ribs = 8
) {
  ring(out, x, y, z, r, n);
  ring(out, x, y, z + h, r, n);
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2;
    const c = Math.cos(a) * r;
    const s = Math.sin(a) * r;
    line(out, [x + c, y + s, z], [x + c, y + s, z + h]);
  }
}

function sphere(out: Segments, x: number, y: number, z: number, r: number, lat = 7, lon = 12) {
  const zc = z + r;
  for (let i = 1; i < lat; i++) {
    const p = (i / lat) * Math.PI;
    ring(out, x, y, zc - Math.cos(p) * r, Math.sin(p) * r, 32);
  }
  for (let j = 0; j < lon; j++) {
    const a = (j / lon) * Math.PI * 2;
    const pts: Point[] = [];
    for (let i = 0; i <= 18; i++) {
      const p = (i / 18) * Math.PI;
      pts.push([
        x + Math.cos(a) * Math.sin(p) * r,
        y + Math.sin(a) * Math.sin(p) * r,
        zc - Math.cos(p) * r,
      ]);
    }
    polyline(out, pts);
  }
}

// ── One builder per pavilion, drawn around the origin ───────────────────
const BUILDERS: Record<string, (o: Segments, side: number) => void> = {
  // The 1939 World's Fair: the Trylon and the Perisphere, where every expo begins.
  gate(o, side) {
    sphere(o, 0, 0, 0, 230);
    const apex: Point = [-side * 330, -40, 980];
    const base: Point[] = [
      [-side * 420, -130, 0],
      [-side * 240, -130, 0],
      [-side * 330, 50, 0],
    ];
    polyline(o, base, true);
    base.forEach((b) => line(o, b, apex));
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const tier = base.map((b): Point => [
        b[0] + (apex[0] - b[0]) * t,
        b[1] + (apex[1] - b[1]) * t,
        b[2] + (apex[2] - b[2]) * t,
      ]);
      polyline(o, tier, true);
    }
    // The Helicline ramp spiralling down off the sphere.
    const ramp: Point[] = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 2.4;
      const r = 270 + i * 2.6;
      ramp.push([Math.cos(a) * r, Math.sin(a) * r, 150 * (1 - i / 60)]);
    }
    polyline(o, ramp);
  },
  // Stonehenge: memory that outlasts its tools.
  stone(o) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * 230;
      const y = Math.sin(a) * 230;
      box(o, x, y, 0, 60, 40, 240);
      const nx = Math.cos(a + Math.PI / n) * 230;
      const ny = Math.sin(a + Math.PI / n) * 230;
      if (i % 2 === 0) box(o, nx, ny, 240, 170, 40, 32);
    }
    box(o, 0, 0, 0, 90, 60, 340);
  },
  // Stacked browser windows, each with a little tab on top.
  tabbit(o) {
    for (let i = 0; i < 6; i++) {
      const y = -180 + i * 72;
      const x0 = -210 + i * 12;
      const x1 = 210 + i * 12;
      polyline(
        o,
        [
          [x0, y, 0],
          [x1, y, 0],
          [x1, y, 300],
          [x0, y, 300],
        ],
        true
      );
      polyline(o, [
        [x0, y, 262],
        [x1, y, 262],
      ]);
      polyline(o, [
        [x0 + 16, y, 300],
        [x0 + 28, y, 334],
        [x0 + 118, y, 334],
        [x0 + 130, y, 300],
      ]);
    }
  },
  // A house with its roof open and a sun arc over it.
  blueprint(o, side) {
    box(o, 0, 0, 0, 440, 320, 190);
    box(o, side * 80, 0, 0, 4, 320, 190);
    polyline(o, [
      [-220, -160, 190],
      [0, -160, 320],
      [220, -160, 190],
    ]);
    polyline(o, [
      [-220, 160, 190],
      [0, 160, 320],
      [220, 160, 190],
    ]);
    line(o, [0, -160, 320], [0, 160, 320]);
    const arc: Point[] = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI;
      arc.push([Math.cos(a) * 470, -40, Math.sin(a) * 620]);
    }
    polyline(o, arc);
    ring(o, Math.cos(1.1) * 470, -40, Math.sin(1.1) * 620, 26, 18);
  },
  // A record deck big enough to stand on.
  turntable(o, side) {
    cylinder(o, 0, 0, 34, 270, 18, 44, 22);
    for (let r = 50; r < 260; r += 42) ring(o, 0, 0, 52, r, 40);
    box(o, 0, 0, 0, 660, 620, 34);
    cylinder(o, side * 275, -240, 34, 22, 80);
    polyline(o, [
      [side * 275, -240, 114],
      [side * 200, -40, 104],
      [side * 60, 80, 62],
    ]);
    box(o, side * 56, 86, 56, 34, 44, 12);
  },
  // Two figures, drawn at their true heights.
  fitroom(o) {
    const figure = (x: number, h: number) => {
      const head = h * 0.08;
      ring(o, x, 0, h - head, head, 18);
      ring(o, x, 0, h - head * 2, head * 0.5, 10);
      box(o, x, 0, h * 0.46, h * 0.26, h * 0.13, h * 0.36);
      box(o, x - h * 0.07, 0, 0, h * 0.09, h * 0.1, h * 0.46);
      box(o, x + h * 0.07, 0, 0, h * 0.09, h * 0.1, h * 0.46);
      line(o, [x - 150, -60, h], [x + 150, -60, h]);
    };
    figure(-170, 600);
    figure(170, 500);
  },
  // A vault door: the private parts stay private.
  strid(o) {
    box(o, 0, 0, 0, 480, 180, 420);
    for (let i = 0; i < 3; i++) {
      const r = 130 - i * 44;
      const pts: Point[] = [];
      for (let k = 0; k <= 30; k++) {
        const a = (k / 30) * Math.PI * 2;
        pts.push([Math.cos(a) * r, 92, 210 + Math.sin(a) * r]);
      }
      polyline(o, pts);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      line(
        o,
        [Math.cos(a) * 42, 92, 210 + Math.sin(a) * 42],
        [Math.cos(a) * 130, 92, 210 + Math.sin(a) * 130]
      );
    }
  },
  // An origami bird.
  birdbrain(o) {
    const body: Point = [0, 0, 200];
    const nose: Point = [0, -300, 240];
    const tail: Point = [0, 300, 320];
    const wingL: Point = [-420, 40, 390];
    const wingR: Point = [420, 40, 390];
    const belly: Point = [0, 40, 120];
    [wingL, wingR].forEach((w) => {
      polyline(o, [nose, w, tail, body], true);
      line(o, w, body);
    });
    polyline(o, [nose, belly, tail]);
    line(o, belly, body);
    polyline(o, [
      [0, 40, 120],
      [-16, 70, 0],
    ]);
    polyline(o, [
      [0, 40, 120],
      [16, 70, 0],
    ]);
    polyline(o, [
      [-100, 110, 0],
      [100, 110, 0],
    ]);
  },
  // A skyline of candlesticks.
  paperfolio(o) {
    let price = 170;
    for (let i = 0; i < 12; i++) {
      const x = -330 + i * 60;
      const move = Math.sin(i * 1.7) * 72 + (i % 3) * 14;
      const open = price;
      const close = Math.max(50, price + move);
      const lo = Math.min(open, close) - 34;
      const hi = Math.max(open, close) + 34;
      box(o, x, 0, Math.min(open, close), 36, 36, Math.abs(close - open) + 6);
      line(o, [x, 0, lo], [x, 0, Math.min(open, close)]);
      line(o, [x, 0, Math.max(open, close)], [x, 0, hi]);
      price = close;
    }
    polyline(o, [
      [-370, 0, 0],
      [370, 0, 0],
    ]);
  },
  // A wristwatch as a rotunda.
  garatch(o) {
    cylinder(o, 0, 0, 170, 220, 60, 40, 16);
    ring(o, 0, 0, 230, 190, 40);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      line(
        o,
        [Math.cos(a) * 170, Math.sin(a) * 170, 230],
        [Math.cos(a) * 188, Math.sin(a) * 188, 230]
      );
    }
    line(o, [0, 0, 230], [90, -80, 230]);
    line(o, [0, 0, 230], [-30, -150, 230]);
    for (const y of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const yy = y * (220 + i * 56);
        polyline(o, [
          [-110, yy, 170 - i * 24],
          [110, yy, 170 - i * 24],
        ]);
        if (i) {
          line(o, [-110, yy, 170 - i * 24], [-110, yy - y * 56, 170 - (i - 1) * 24]);
          line(o, [110, yy, 170 - i * 24], [110, yy - y * 56, 170 - (i - 1) * 24]);
        }
      }
    }
  },
  // Kaze means wind: a tornado on its way through the code.
  kaze(o) {
    const pts: Point[] = [];
    for (let i = 0; i <= 260; i++) {
      const t = i / 260;
      const a = t * Math.PI * 22;
      const r = 26 + t * t * 270;
      pts.push([Math.cos(a) * r + Math.sin(t * 5) * 40, Math.sin(a) * r, t * 720]);
    }
    polyline(o, pts);
  },
  // tmux panes as a block of offices, with a dot on the door.
  dotfiles(o) {
    for (let level = 0; level < 4; level++) {
      const z = level * 130;
      box(o, -130, 0, z, 240, 240, 120);
      box(o, 120, -60, z, 240, 120, 120);
      box(o, 120, 60, z, 240, 120, 120);
    }
    ring(o, 0, 170, 40, 30, 16);
    ring(o, 0, 170, 40, 6, 8);
  },
};

export type PavilionSite = { id: string; y: number };

/** Every pavilion, placed at its section, as one big buffer of line segments. */
export function pavilionSegments(sites: PavilionSite[], sheetWidth: number) {
  const positions: number[] = [];
  const brightness: number[] = [];
  sites.forEach((site, index) => {
    const build = BUILDERS[site.id];
    if (!build) return;
    // Build the same pavilion on both flanks, the right one a mirror of the left.
    for (const side of [-1, 1]) {
      const local: Segments = [];
      build(local, side);
      const flank = side * (sheetWidth / 2 + 460 + (index % 3) * 40);
      for (let i = 0; i < local.length; i += 3) {
        positions.push(flank + local[i] * side, site.y + local[i + 1], local[i + 2]);
        brightness.push(0.85);
      }
    }
  });
  return { positions: new Float32Array(positions), brightness: new Float32Array(brightness) };
}
