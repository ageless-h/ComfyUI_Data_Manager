/**
 * Example Test File
 * Verifies that the testing infrastructure is correctly configured
 */

import { describe, it, expect } from 'vitest';

describe('Testing Infrastructure', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should have access to happy-dom', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello from happy-dom';
    expect(div.textContent).toBe('Hello from happy-dom');
  });
});
