// The shape of the paper. A sheet that lies flat, then winds up along an Euler spiral: tangent
// angle grows with the square of distance, so curvature grows in step with it. The integral has
// no closed form, so it is tabulated once here and read by both the shaders and the hit test.

export const CURVE_SAMPLES = 4096;

export class Curve {
  /** run, rise, normal run, normal rise for each sample. */
  readonly data = new Float32Array(CURVE_SAMPLES * 4);
  readonly step: number;

  constructor(
    readonly range: number,
    /** Distance from the near line where the paper starts to lift. */
    readonly start: number,
    /** Spiral scale: the larger, the wider the roll. */
    public scale: number
  ) {
    this.step = range / (CURVE_SAMPLES - 1);
    this.build(0);
  }

  /** Rebuild the table with the spiral at `bend` of full strength. */
  build(bend: number) {
    const { data, step, start, scale } = this;
    const k = bend / (2 * scale * scale);
    let run = 0;
    let rise = 0;
    for (let i = 0; i < CURVE_SAMPLES; i++) {
      const u = Math.max(0, i * step - start);
      const angle = k * u * u;
      data[i * 4] = run;
      data[i * 4 + 1] = rise;
      data[i * 4 + 2] = -Math.sin(angle);
      data[i * 4 + 3] = Math.cos(angle);
      const mid = u + (i * step + step / 2 > start ? step / 2 : 0);
      const midAngle = k * mid * mid;
      run += Math.cos(midAngle) * step;
      rise += Math.sin(midAngle) * step;
    }
  }

  /** Where a distance along the paper sits: `[run, rise, normalRun, normalRise]`. */
  at(s: number, out: [number, number, number, number] = [0, 0, 0, 1]) {
    if (s < 0) {
      out[0] = s;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    }
    const t = Math.min(s, this.range) / this.step;
    const i = Math.min(Math.floor(t), CURVE_SAMPLES - 2);
    const f = t - i;
    const d = this.data;
    for (let c = 0; c < 4; c++) out[c] = d[i * 4 + c] + (d[(i + 1) * 4 + c] - d[i * 4 + c]) * f;
    return out;
  }
}
