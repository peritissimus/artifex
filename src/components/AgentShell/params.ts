export interface AgentParams {
  parallax: number; // mouse parallax 0..3
  vignette: number; // room edge darkening 0..1
  fontSize: number;
  opacity: number; // shell texture opacity 0.4..1
  accent: string;
  bloom: number; // post-process bloom 0..2
  scanlines: number; // shell-internal horizontal lines 0..1
  grain: number; // room atmosphere noise 0..1
  flicker: number; // room brightness flicker 0..1
  curve: number; // shell glass bend at bottom 0..1
  lensWarp: number; // shell texture barrel distortion 0..0.3
}

export const DEFAULT_PARAMS: AgentParams = {
  parallax: 0.4,
  vignette: 0.48,
  fontSize: 18,
  opacity: 1,
  accent: '#6FB7FF',
  bloom: 0.72,
  scanlines: 0,
  grain: 0.1,
  flicker: 0.12,
  curve: 0.14,
  lensWarp: 0.025,
};
