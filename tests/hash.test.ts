import { describe, it, expect } from 'vitest';
import { hash } from '../utils/hash';

describe('hash()', () => {
  it('is deterministic for same input', () => {
    const a = hash('hello-world');
    const b = hash('hello-world');
    expect(a).toBe(b);
  });

  it('produces uint32 range', () => {
    const v = hash('abc');
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(0xffffffff);
  });

  it('distinguishes similar inputs', () => {
    const a = hash('user:1:2024-01-01');
    const b = hash('user:2:2024-01-01');
    expect(a).not.toBe(b);
  });
});
