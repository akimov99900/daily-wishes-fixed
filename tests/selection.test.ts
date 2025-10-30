import { describe, it, expect } from 'vitest';
import { wishIndex } from '../utils/selection';

const wishesLength = 33;

describe('wishIndex()', () => {
  it('uses date-only when fid is missing', () => {
    const idx1 = wishIndex(undefined, '2024-01-01', wishesLength);
    const idx2 = wishIndex(null as any, '2024-01-01', wishesLength);
    expect(idx1).toBe(idx2);
  });

  it('varies by fid for the same date', () => {
    const d = '2024-01-02';
    const a = wishIndex(1, d, wishesLength);
    const b = wishIndex(2, d, wishesLength);
    expect(a).not.toBe(b);
  });

  it('is deterministic across calls', () => {
    const d = '2024-05-20';
    const idx1 = wishIndex(42, d, wishesLength);
    const idx2 = wishIndex(42, d, wishesLength);
    expect(idx1).toBe(idx2);
  });

  it('bounds index by wishes length', () => {
    for (let i = 0; i < 50; i++) {
      const idx = wishIndex(i, '2024-06-01', wishesLength);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(wishesLength);
    }
  });
});
