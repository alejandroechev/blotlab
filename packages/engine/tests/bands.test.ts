import { describe, it, expect } from 'vitest';
import { detectBands, horizontalProfile } from '../src/bands.js';
import { fromArray } from '../src/image.js';
import { Lane } from '../src/lanes.js';

describe('Band Detection', () => {
  it('horizontalProfile sums rows within lane', () => {
    // 4×3 image, lane from x=1 to x=3
    const img = fromArray([
      1, 10, 20, 5,
      2, 30, 40, 6,
      3, 50, 60, 7,
    ], 4, 3);
    const lane: Lane = { x0: 1, x1: 3 };
    const profile = horizontalProfile(img, lane);
    expect(profile[0]).toBe(30);  // 10+20
    expect(profile[1]).toBe(70);  // 30+40
    expect(profile[2]).toBe(110); // 50+60
  });

  it('detects bands in synthetic image with bright rows', () => {
    // 10×30 image: rows 5-9 bright, rows 20-24 bright
    const data = new Array(300).fill(10);
    for (let y = 5; y < 10; y++) {
      for (let x = 0; x < 10; x++) data[y * 10 + x] = 200;
    }
    for (let y = 20; y < 25; y++) {
      for (let x = 0; x < 10; x++) data[y * 10 + x] = 200;
    }
    const img = fromArray(data, 10, 30);
    const lanes: Lane[] = [{ x0: 0, x1: 10 }];
    const bands = detectBands(img, lanes);
    expect(bands.length).toBe(2);
    expect(bands[0].y0).toBeLessThanOrEqual(5);
    expect(bands[0].y1).toBeGreaterThanOrEqual(9);
  });
});
