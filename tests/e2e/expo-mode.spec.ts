import { test } from '@playwright/test';
import { defineExpoModeTests, expoBrowser } from './expo-mode.shared';

// The plain flag behaves like the origin trial visitors get: hit-test geometry does nothing here.
test.use(expoBrowser(['--enable-blink-features=CanvasDrawElement']));
defineExpoModeTests();
