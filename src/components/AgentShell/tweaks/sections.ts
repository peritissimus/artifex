import { BG_LAYER } from '../layers/background';
import { SHELL_LAYER } from '../layers/shell';
import { SCENE_LAYER } from '../scene';
import type { LayerGroup } from './types';

/**
 * The full panel layout, in display order. Each owner contributes a
 * LayerGroup — adding a knob to a layer means editing only that layer's
 * file, not this aggregator.
 */
export const LAYERS: LayerGroup[] = [SCENE_LAYER, BG_LAYER, SHELL_LAYER];
