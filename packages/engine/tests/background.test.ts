import { describe, it, expect } from 'vitest';
import { subtractBackground } from '../src/background.js';
import { createGrayImage, fromArray } from '../src/image.js';

describe('Rolling Ball Background Subtraction', () => {
  it('removes uniform background completely', () => {
    // Uniform image → background ≈ image → subtracted ≈ 0
    const img = createGrayImage(20, 20, 100);
    const result = subtractBackground(img, 3);
    for (let i = 0; i < result.data.length; i++) {
      expect(result.data[i]).toBeCloseTo(0, 0);
    }
  });

  it('preserves sharp peaks above background', () => {
    // 20x20 uniform 10, with a bright 5x5 spot of 200 in the center
    const data = new Array(400).fill(10);
    for (let y = 8; y < 13; y++) {
      for (let x = 8; x < 13; x++) {
        data[y * 20 + x] = 200;
      }
    }
    const img = fromArray(data, 20, 20);
    const result = subtractBackground(img, 3);

    // Center of bright spot should have high corrected intensity
    const centerVal = result.data[10 * 20 + 10];
    expect(centerVal).toBeGreaterThan(50);

    // Background region should be near zero
    expect(result.data[0]).toBeCloseTo(0, 0);
  });

  it('output is non-negative', () => {
    const img = fromArray([0, 50, 100, 50, 0, 50, 100, 50, 0], 3, 3);
    const result = subtractBackground(img, 1);
    for (let i = 0; i < result.data.length; i++) {
      expect(result.data[i]).toBeGreaterThanOrEqual(0);
    }
  });
});
