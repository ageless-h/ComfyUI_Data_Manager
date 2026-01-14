/**
 * Vitest Global Setup File
 * Configures global mocks and test environment
 */

import { beforeEach, vi } from 'vitest';

// Mock ComfyUI app.js - this file doesn't exist in test environment
vi.mock('scripts/app.js', () => ({
  app: {
    registerExtension: vi.fn(),
  },
}));

// Mock comfy_api
vi.mock('./comfy-shim.d.ts', () => ({
  comfy_api: {},
}));

// Configure global fetch mock
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});
