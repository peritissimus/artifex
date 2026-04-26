export interface AgentParams {
  curve: number; // barrel curve at bottom 0..1
  tilt: number; // baseline tilt back 0..1
  parallax: number; // mouse parallax 0..3
  vignette: number; // vignette darkness 0..1
  glow: number; // halo behind terminal 0..2
  fontSize: number;
  opacity: number;
  accent: string;
  bloom: number; // phosphor bloom 0..2
  scanlines: number; // CRT horizontal scanlines 0..1
  grain: number; // film grain / signal noise 0..1
  flicker: number; // global brightness flicker 0..1
  crt: number; // overall CRT barrel distortion 0..0.4
}

export const DEFAULT_PARAMS: AgentParams = {
  curve: 0.3,
  tilt: 0.02,
  parallax: 0.4,
  vignette: 0.48,
  glow: 0.72,
  fontSize: 18,
  opacity: 1,
  accent: '#6FB7FF',
  bloom: 0.72,
  scanlines: 0.035,
  grain: 0.1,
  flicker: 0.12,
  crt: 0.05,
};
