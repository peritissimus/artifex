// Behaviour for the pavilion exhibits. Everything here is ordinary DOM code: it has no idea
// whether the page is flat or wrapped around a curve, which is the point of the exhibit.

type Root = HTMLElement;

const q = <T extends Element = HTMLElement>(root: Element, selector: string) =>
  root.querySelector<T>(selector)!;
const qa = <T extends Element = HTMLElement>(root: Element, selector: string) => [
  ...root.querySelectorAll<T>(selector),
];
const pressOnly = (buttons: HTMLElement[], active: HTMLElement) =>
  buttons.forEach((button) => button.setAttribute('aria-pressed', String(button === active)));
const inr = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const every = (ms: number, tick: () => void) => {
  tick();
  return window.setInterval(() => {
    if (!document.hidden) tick();
  }, ms);
};

function gate(root: Root) {
  const echoIn = q<HTMLInputElement>(root, '[data-echo-in]');
  const echoOut = q(root, '[data-echo-out]');
  echoIn.addEventListener('input', () => {
    echoOut.textContent = echoIn.value || '…';
  });

  let count = 0;
  q(root, '[data-count]').addEventListener('click', () => {
    count += 1;
    q(root, '[data-count-n]').textContent = String(count);
  });

  const more = q(root, '[data-more]');
  const moreText = q(root, '[data-more-text]');
  more.addEventListener('click', () => {
    moreText.hidden = !moreText.hidden;
    more.setAttribute('aria-expanded', String(!moreText.hidden));
    more.textContent = moreText.hidden ? 'More' : 'Less';
  });
}

function stone(root: Root) {
  const KEY = 'expo-149-note';
  const FIRST_NOTE = `# A note\n\nType here. This is a real **textarea**, even when it is wrapped around a curve.\n\n- plain Markdown\n- no account\n- yours`;
  const note = q<HTMLTextAreaElement>(root, '[data-note]');
  const preview = q(root, '[data-note-preview]');
  const status = q(root, '[data-note-status]');
  const words = q(root, '[data-note-words]');
  q(root, '[data-note-date]').textContent = new Date().toISOString().slice(0, 10);

  const render = () => {
    const html = escapeHtml(note.value)
      .split('\n')
      .map((line) => {
        const inline = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('# ')) return `<h4>${inline.slice(2)}</h4>`;
        if (line.startsWith('- ')) return `<li>${inline.slice(2)}</li>`;
        return line.trim() ? `<p>${inline}</p>` : '';
      })
      .join('');
    preview.innerHTML = html;
    const count = note.value.trim().split(/\s+/).filter(Boolean).length;
    words.textContent = `${count} ${count === 1 ? 'word' : 'words'}`;
  };

  try {
    note.value = localStorage.getItem(KEY) ?? FIRST_NOTE;
  } catch {
    note.value = FIRST_NOTE;
    status.textContent = 'not saved: storage is blocked';
  }
  note.addEventListener('input', () => {
    render();
    try {
      localStorage.setItem(KEY, note.value);
      status.textContent = 'saved in this browser';
    } catch {
      status.textContent = 'not saved: storage is blocked';
    }
  });
  render();
}

function tabbit(root: Root) {
  const clock = q(root, '[data-clock]');
  every(1000, () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (clock.textContent !== time) clock.textContent = time;
  });

  const search = q<HTMLInputElement>(root, '[data-tab-search]');
  const items = qa(root, '[data-tab-grid] li');
  search.addEventListener('input', () => {
    const term = search.value.trim().toLowerCase();
    items.forEach((item) => {
      item.hidden = !!term && !item.dataset.name!.includes(term);
    });
  });

  qa(root, '[data-tab-group]').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.nextElementSibling?.toggleAttribute('hidden', !open);
    });
  });
  qa(root, '[data-noop]').forEach((link) =>
    link.addEventListener('click', (event) => event.preventDefault())
  );
}

function blueprint(root: Root) {
  const LATITUDE = 12.97;
  const rad = Math.PI / 180;
  // Wall openings: endpoints plus the outward normal, in plan units. North is up.
  const windows = [
    { name: 'south door', a: [390, 390], b: [530, 390], out: [0, 1] },
    { name: 'south window', a: [120, 390], b: [220, 390], out: [0, 1] },
    { name: 'east window', a: [580, 120], b: [580, 260], out: [1, 0] },
    { name: 'west window', a: [60, 280], b: [60, 350], out: [-1, 0] },
  ];
  const SILL = 18;
  const HEAD = 150;

  const light = q<SVGGElement>(root, '[data-plan-light]');
  const range = q<HTMLInputElement>(root, '[data-plan-range]');
  const seasons = qa(root, '[data-season]');
  let declination = 0;

  const draw = () => {
    const hours = Number(range.value);
    const hourAngle = (hours - 12) * 15 * rad;
    const lat = LATITUDE * rad;
    const dec = declination * rad;
    const sinAlt =
      Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle);
    const alt = Math.asin(sinAlt);
    const cosAz = (Math.sin(dec) - sinAlt * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
    let az = Math.acos(Math.min(1, Math.max(-1, cosAz)));
    if (hourAngle > 0) az = 2 * Math.PI - az;

    // Horizontal direction towards the sun, in plan coordinates where +y is south.
    const sun = [Math.sin(az), -Math.cos(az)];
    const reach = alt > 0.02 ? 1 / Math.tan(alt) : 0;
    const through: string[] = [];
    let polygons = '';
    for (const w of windows) {
      if (alt <= 0.02 || sun[0] * w.out[0] + sun[1] * w.out[1] <= 0.02) continue;
      const along = [-sun[0] * reach, -sun[1] * reach];
      const point = (p: number[], height: number) =>
        `${p[0] + along[0] * height},${p[1] + along[1] * height}`;
      polygons += `<polygon points="${point(w.a, SILL)} ${point(w.b, SILL)} ${point(w.b, HEAD)} ${point(w.a, HEAD)}"/>`;
      through.push(w.name);
    }
    light.innerHTML = polygons;

    const whole = Math.floor(hours);
    const minutes = Math.round((hours - whole) * 60);
    q(root, '[data-plan-time]').textContent =
      `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    q(root, '[data-plan-alt]').textContent = `${(alt / rad).toFixed(1)}°`;
    q(root, '[data-plan-az]').textContent = `${(az / rad).toFixed(1)}°`;
    q(root, '[data-plan-through]').textContent = through.length
      ? through.join(', ')
      : 'no direct sun';
  };

  range.addEventListener('input', draw);
  seasons.forEach((button) =>
    button.addEventListener('click', () => {
      declination = Number(button.dataset.season);
      pressOnly(seasons, button);
      draw();
    })
  );
  draw();

  const plan = q<SVGSVGElement>(root, '[data-plan]');
  qa<SVGRectElement>(root, '[data-drag]').forEach((rect) => {
    rect.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      rect.setPointerCapture(event.pointerId);
      const box = plan.getBoundingClientRect();
      const scale = 640 / box.width;
      const startX = Number(rect.getAttribute('x'));
      const startY = Number(rect.getAttribute('y'));
      const originX = event.clientX;
      const originY = event.clientY;
      const move = (e: PointerEvent) => {
        rect.setAttribute('x', String(startX + (e.clientX - originX) * scale));
        rect.setAttribute('y', String(startY + (e.clientY - originY) * scale));
      };
      const up = () => {
        rect.removeEventListener('pointermove', move);
        rect.removeEventListener('pointerup', up);
      };
      rect.addEventListener('pointermove', move);
      rect.addEventListener('pointerup', up);
    });
  });
}

function turntable(root: Root) {
  const device = q(root, '[data-turn-device]');
  const orbit = q<HTMLInputElement>(root, '[data-turn-orbit]');
  const tilt = q<HTMLInputElement>(root, '[data-turn-tilt]');
  const spin = q(root, '[data-turn-spin]');
  let spinning = true;

  const apply = () => {
    device.style.transform = `rotateX(${tilt.value}deg) rotateY(${orbit.value}deg)`;
    q(root, '[data-turn-orbit-out]').textContent = `${orbit.value}°`;
    q(root, '[data-turn-tilt-out]').textContent = `${tilt.value}°`;
  };
  const setSpin = (on: boolean) => {
    spinning = on;
    spin.setAttribute('aria-pressed', String(on));
  };

  [orbit, tilt].forEach((input) =>
    input.addEventListener('input', () => {
      setSpin(false);
      apply();
    })
  );
  qa(root, '[data-turn-preset]').forEach((button) =>
    button.addEventListener('click', () => {
      const [y, x] = button.dataset.turnPreset!.split(',');
      orbit.value = y;
      tilt.value = x;
      setSpin(false);
      apply();
    })
  );
  spin.addEventListener('click', () => setSpin(!spinning));

  apply();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setSpin(false);
    return;
  }
  every(50, () => {
    if (!spinning) return;
    const next = Number(orbit.value) + 1;
    orbit.value = String(next > 180 ? -180 : next);
    apply();
  });
}

function fitroom(root: Root) {
  const aRange = q<HTMLInputElement>(root, '[data-fit-a-range]');
  const bRange = q<HTMLInputElement>(root, '[data-fit-b-range]');
  const groupA = q<SVGGElement>(root, '[data-fit-a]');
  const groupB = q<SVGGElement>(root, '[data-fit-b]');
  const swatches = qa(root, '[data-fit-outfit]');
  const FLOOR = 400;
  const PIXELS_PER_INCH = 4.6;
  let outfit = '#c8402a';

  const feet = (inches: number) => `${Math.floor(inches / 12)}′${inches % 12}″`;
  const figure = (cx: number, inches: number, top: string) => {
    const h = inches * PIXELS_PER_INCH;
    const head = h * 0.13;
    const y = FLOOR - h;
    const shoulder = h * 0.27;
    return `<circle cx="${cx}" cy="${y + head / 2}" r="${head / 2}" fill="var(--ink)"/>
      <rect x="${cx - shoulder / 2}" y="${y + head * 1.1}" width="${shoulder}" height="${h * 0.38}" fill="${top}"/>
      <rect x="${cx - shoulder * 0.42}" y="${y + head * 1.1 + h * 0.38}" width="${shoulder * 0.38}" height="${FLOOR - (y + head * 1.1 + h * 0.38)}" fill="var(--ink)"/>
      <rect x="${cx + shoulder * 0.04}" y="${y + head * 1.1 + h * 0.38}" width="${shoulder * 0.38}" height="${FLOOR - (y + head * 1.1 + h * 0.38)}" fill="var(--ink)"/>
      <path d="M${cx - 86} ${y}H${cx + 86}" class="ex-fit-mark"/>
      <text x="${cx}" y="${y - 8}" text-anchor="middle" class="ex-fit-label">${feet(inches)}</text>`;
  };
  const draw = () => {
    const a = Number(aRange.value);
    const b = Number(bRange.value);
    groupA.innerHTML = figure(160, a, outfit);
    groupB.innerHTML = figure(360, b, outfit);
    q(root, '[data-fit-a-out]').textContent = feet(a);
    q(root, '[data-fit-b-out]').textContent = feet(b);
    const gap = Math.abs(a - b);
    q(root, '[data-fit-diff]').textContent = gap ? `${gap} in apart` : 'Exactly the same height';
  };

  [aRange, bRange].forEach((input) => input.addEventListener('input', draw));
  swatches.forEach((swatch) =>
    swatch.addEventListener('click', () => {
      outfit = swatch.dataset.fitOutfit!;
      pressOnly(swatches, swatch);
      draw();
    })
  );
  draw();
}

function strid(root: Root) {
  const input = q<HTMLTextAreaElement>(root, '[data-strid-in]');
  const output = q(root, '[data-strid-out]');
  const counts = q(root, '[data-strid-counts]');
  const styles = qa(root, '[data-strid-style]');
  let style = 'bar';

  const RULES: [string, RegExp][] = [
    ['UPI', /\b[\w.-]+@(?:ok\w+|upi|ybl|paytm|axl|ibl)\b/g],
    ['IFSC', /\b[A-Z]{4}0[A-Z0-9]{6}\b/g],
    ['PAN', /\b[A-Z]{5}\d{4}[A-Z]\b/g],
    ['Aadhaar', /\b\d{4}\s?\d{4}\s?\d{4}\b/g],
  ];

  const draw = () => {
    const found: { start: number; end: number; kind: string }[] = [];
    for (const [kind, rule] of RULES) {
      for (const match of input.value.matchAll(rule)) {
        found.push({ start: match.index, end: match.index + match[0].length, kind });
      }
    }
    found.sort((a, b) => a.start - b.start);

    let html = '';
    let cursor = 0;
    const tally = new Map<string, number>();
    for (const hit of found) {
      if (hit.start < cursor) continue;
      html += escapeHtml(input.value.slice(cursor, hit.start));
      const secret = input.value.slice(hit.start, hit.end);
      html +=
        style === 'bar'
          ? `<mark class="is-bar">${'█'.repeat(Math.min(secret.length, 18))}</mark>`
          : `<mark class="is-label">${hit.kind}</mark>`;
      cursor = hit.end;
      tally.set(hit.kind, (tally.get(hit.kind) ?? 0) + 1);
    }
    html += escapeHtml(input.value.slice(cursor));
    output.innerHTML = html;
    counts.innerHTML = tally.size
      ? [...tally].map(([kind, n]) => `<li>${kind} × ${n}</li>`).join('')
      : '<li>Nothing to hide</li>';
  };

  input.addEventListener('input', draw);
  styles.forEach((button) =>
    button.addEventListener('click', () => {
      style = button.dataset.stridStyle!;
      pressOnly(styles, button);
      draw();
    })
  );
  draw();
}

function birdbrain(root: Root) {
  const search = q<HTMLInputElement>(root, '[data-bird-search]');
  const topics = qa(root, '[data-bird-topic]');
  const items = qa(root, '[data-bird-list] li');
  let topic = 'All';

  const draw = () => {
    const term = search.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((item) => {
      const visible =
        (topic === 'All' || item.dataset.topic === topic) &&
        (!term || item.dataset.text!.includes(term));
      item.hidden = !visible;
      if (visible) shown += 1;
    });
    q(root, '[data-bird-count]').textContent = String(shown);
  };

  search.addEventListener('input', draw);
  topics.forEach((button) =>
    button.addEventListener('click', () => {
      topic = button.dataset.birdTopic!;
      pressOnly(topics, button);
      draw();
    })
  );
}

function paperfolio(root: Root) {
  const START_CASH = 100000;
  const LOT = 10;
  const POINTS = 70;
  const makeSeries = (start: number) => {
    const series = [start];
    while (series.length < POINTS) series.push(step(series[series.length - 1]));
    return series;
  };
  function step(price: number) {
    return Math.max(20, price * (1 + (Math.random() - 0.495) * 0.018));
  }
  const series: Record<string, number[]> = {
    NIB: makeSeries(1490),
    INK: makeSeries(342),
    RULE: makeSeries(78),
  };
  const held: Record<string, number> = { NIB: 0, INK: 0, RULE: 0 };
  const buttons = qa(root, '[data-paper-ticker]');
  const line = q<SVGPathElement>(root, '[data-paper-line]');
  let ticker = 'NIB';
  let cash = START_CASH;

  const last = (name: string) => series[name][series[name].length - 1];
  const draw = () => {
    const data = series[ticker];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    line.setAttribute(
      'd',
      data
        .map((value, i) => {
          const x = (i / (POINTS - 1)) * 600;
          const y = 245 - ((value - min) / span) * 230;
          return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join('')
    );
    const change = (last(ticker) / data[0] - 1) * 100;
    q(root, '[data-paper-price]').textContent = inr(last(ticker));
    q(root, '[data-paper-move]').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;

    const value = cash + Object.keys(held).reduce((sum, name) => sum + held[name] * last(name), 0);
    const profit = value - START_CASH;
    q(root, '[data-paper-cash]').textContent = inr(cash);
    q(root, '[data-paper-held]').textContent = `${held[ticker]} ${ticker}`;
    q(root, '[data-paper-value]').textContent = inr(value);
    q(root, '[data-paper-pnl]').textContent = `${profit >= 0 ? '+' : '−'}${inr(Math.abs(profit))}`;
  };

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      ticker = button.dataset.paperTicker!;
      pressOnly(buttons, button);
      draw();
    })
  );
  q(root, '[data-paper-buy]').addEventListener('click', () => {
    const cost = last(ticker) * LOT;
    if (cost > cash) return;
    cash -= cost;
    held[ticker] += LOT;
    draw();
  });
  q(root, '[data-paper-sell]').addEventListener('click', () => {
    if (held[ticker] < LOT) return;
    cash += last(ticker) * LOT;
    held[ticker] -= LOT;
    draw();
  });

  every(1000, () => {
    for (const name of Object.keys(series)) {
      series[name].push(step(last(name)));
      series[name].shift();
    }
    draw();
  });
}

function garatch(root: Root) {
  const face = q<SVGSVGElement>(root, '[data-watch-face]');
  const note = q(root, '[data-watch-note]');
  const buttons = qa(root, '[data-watch-thesis]');
  let thesis = 'minimal';

  const NOTES: Record<string, string> = {
    minimal: 'Only the time. Everything else can wait.',
    orbit: 'Seconds, minutes and hours as three planets on their own tracks.',
    telemetry: 'As much as one glance can carry, and not a line more.',
  };
  const polar = (angle: number, radius: number) => {
    const a = (angle - 90) * (Math.PI / 180);
    return [160 + Math.cos(a) * radius, 160 + Math.sin(a) * radius];
  };
  const arc = (radius: number, fraction: number, cls: string) => {
    const f = Math.min(fraction, 0.9999);
    const [x, y] = polar(f * 360, radius);
    return `<path class="${cls}" d="M160 ${160 - radius}A${radius} ${radius} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y}"/>`;
  };

  const draw = () => {
    const now = new Date();
    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hour = now.getHours();
    const hh = String(hour).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    let body = '<circle class="w-case" cx="160" cy="160" r="156"/>';

    if (thesis === 'minimal') {
      body += `<text class="w-time" x="160" y="186" text-anchor="middle">${hh}:${mm}</text>`;
      body += `<text class="w-small" x="160" y="222" text-anchor="middle">${ss}</text>`;
    } else if (thesis === 'orbit') {
      for (const [radius, angle, size] of [
        [136, (sec / 60) * 360, 5],
        [100, ((min + sec / 60) / 60) * 360, 8],
        [64, (((hour % 12) + min / 60) / 12) * 360, 12],
      ]) {
        const [x, y] = polar(angle, radius);
        body += `<circle class="w-track" cx="160" cy="160" r="${radius}"/><circle class="w-planet" cx="${x}" cy="${y}" r="${size}"/>`;
      }
      body += `<text class="w-small" x="160" y="165" text-anchor="middle">${hh}:${mm}</text>`;
    } else {
      body += arc(146, 0.72, 'w-arc');
      body += arc(130, 0.38, 'w-arc w-arc--2');
      body += `<text class="w-time w-time--small" x="160" y="168" text-anchor="middle">${hh}:${mm}</text>`;
      body += `<text class="w-small" x="160" y="104" text-anchor="middle">7,214 STEPS</text>`;
      body += `<text class="w-small" x="160" y="200" text-anchor="middle">62 BPM · ${ss}s</text>`;
      body += `<text class="w-small" x="160" y="226" text-anchor="middle">BATT 72%</text>`;
    }
    face.innerHTML = body;
    note.textContent = NOTES[thesis];
  };

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      thesis = button.dataset.watchThesis!;
      pressOnly(buttons, button);
      draw();
    })
  );
  every(1000, draw);
}

function kaze(root: Root) {
  // The functions Expo Mode is actually made of. Paths are real, ranking is a toy.
  const INDEX = [
    [
      'pick',
      'mode/world.ts',
      'find the page point under the mouse cursor by casting a ray at the curved sheet',
    ],
    [
      'lockPointer',
      'mode/world.ts',
      'move the dom so the element under the mouse is really there for hover click and drag',
    ],
    [
      'build',
      'mode/curve.ts',
      'integrate the euler spiral into a lookup table of curve positions and normals',
    ],
    ['at', 'mode/curve.ts', 'look up where a distance along the paper sits in the world'],
    [
      'uploadTile',
      'mode/sheet.ts',
      'copy a strip of the page into a webgl texture with texElementSubImage2D',
    ],
    [
      'markDirty',
      'mode/sheet.ts',
      'remember which elements changed so only they are uploaded again',
    ],
    [
      'pavilionSegments',
      'mode/pavilions.ts',
      'draw the wireframe buildings along the ribbon as line segments',
    ],
    [
      'drawOverlay',
      'mode/overlay.ts',
      'draw rulers leader lines dimensions and labels on a 2d canvas',
    ],
    [
      'startRun',
      'mode/game.ts',
      'start the nib game and steer it up the page striking out real words',
    ],
    [
      'attach',
      'mode/world.ts',
      'slot the page into the canvas and bend the flat sheet into the expo',
    ],
    ['detach', 'mode/world.ts', 'unbend the sheet and give the page back to the normal document'],
    ['stone', 'exhibits.ts', 'save a markdown note in local storage and render a preview'],
    [
      'blueprint',
      'exhibits.ts',
      'compute the sun position over bengaluru and draw light through the windows',
    ],
    ['strid', 'exhibits.ts', 'find pan aadhaar ifsc and upi numbers and redact them'],
  ];
  const input = q<HTMLInputElement>(root, '[data-kaze-in]');
  const output = q(root, '[data-kaze-out]');
  const STOP = new Set([
    'the',
    'a',
    'an',
    'is',
    'how',
    'does',
    'what',
    'to',
    'of',
    'and',
    'it',
    'in',
  ]);
  const tokens = (text: string) =>
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token && !STOP.has(token));

  const draw = () => {
    const query = tokens(input.value);
    const ranked = INDEX.map(([name, path, doc]) => {
      const haystack = tokens(`${name} ${doc}`);
      const score = query.filter((token) => haystack.some((word) => word.startsWith(token))).length;
      return { name, path, doc, score: query.length ? score / query.length : 0 };
    })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    output.innerHTML = ranked.length
      ? ranked
          .map(
            (row) => `<li>
              <span class="ex-kaze-score" style="--score:${row.score}"></span>
              <code>${row.name}()</code>
              <span class="ex-label">${row.path}</span>
              <p>${row.doc}</p>
            </li>`
          )
          .join('')
      : '<li><p>Nothing close. Try “curve”, “mouse” or “texture”.</p></li>';
  };
  input.addEventListener('input', draw);
  draw();
}

function dotfiles(root: Root) {
  const output = q(root, '[data-term-out]');
  const input = q<HTMLInputElement>(root, '[data-term-in]');
  const history: string[] = [];
  let cursor = 0;

  const herd = { blocked: 1, working: 2, done: 3 };
  const showHerd = () => {
    for (const key of Object.keys(herd) as (keyof typeof herd)[]) {
      q(root, `[data-herd="${key}"]`).textContent = String(herd[key]);
    }
  };
  const COMMANDS: Record<string, () => string> = {
    help: () => 'help  ls  setup  herd  whoami  clear',
    ls: () =>
      '.config/ghostty  .config/fish  .config/nvim\n.config/tmux     .config/aerospace  starship.toml',
    setup: () =>
      'setup.sh: installs 45 command-line tools through Homebrew, apt, dnf or pacman,\nthen symlinks every config into place. Safe to re-run.',
    whoami: () => 'peritissimus',
    herd: () => {
      if (herd.working) {
        herd.working -= 1;
        herd.done += 1;
      } else if (herd.blocked) {
        herd.blocked -= 1;
        herd.working += 1;
      }
      showHerd();
      return `${herd.blocked} blocked, ${herd.working} working, ${herd.done} done`;
    },
  };
  const print = (text: string) => {
    output.textContent += `${text}\n`;
    output.scrollTop = output.scrollHeight;
  };

  print('Terminal-first setup for macOS and Linux. Type help.');
  print(`~ ❯ ls\n${COMMANDS.ls()}`);
  print(`~ ❯ setup\n${COMMANDS.setup()}`);
  showHerd();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[cursor] ?? '';
      return;
    }
    if (event.key !== 'Enter') return;
    const command = input.value.trim();
    input.value = '';
    if (!command) return;
    history.push(command);
    cursor = history.length;
    if (command === 'clear') {
      output.textContent = '';
      return;
    }
    print(`~ ❯ ${command}`);
    print(COMMANDS[command]?.() ?? `fish: unknown command: ${command}`);
  });
}

const EXHIBITS: Record<string, (root: Root) => void> = {
  gate,
  stone,
  tabbit,
  blueprint,
  turntable,
  fitroom,
  strid,
  birdbrain,
  paperfolio,
  garatch,
  kaze,
  dotfiles,
};

export function startExhibits() {
  document.querySelectorAll<HTMLElement>('[data-exhibit]').forEach((root) => {
    EXHIBITS[root.dataset.exhibit!]?.(root);
  });
}
