import { test } from '@playwright/test';
import { defineExpoModeTests, expoBrowser } from './expo-mode.shared';

// With experimental web platform features on, hit-test geometry works and the world uses it.
test.use(expoBrowser(['--enable-experimental-web-platform-features']));
defineExpoModeTests();
