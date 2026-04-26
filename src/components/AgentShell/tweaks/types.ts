import type { AgentParams } from '../params';

export type ControlSpec =
  | {
      type: 'range';
      key: keyof AgentParams;
      label: string;
      min: number;
      max: number;
      step: number;
    }
  | { type: 'color'; key: keyof AgentParams; label: string };

export type TweakSection = { title: string; controls: ControlSpec[] };

export type LayerGroup = {
  /** Display name for the layer (Scene, Background, Shell, …). */
  layer: string;
  sections: TweakSection[];
};
