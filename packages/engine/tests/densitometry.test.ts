import { describe, it, expect } from 'vitest';
import { measureBands, integratedIntensity, borderBackground } from '../src/densitometry.js';
import { fromArray } from '../src/image.js';
import { BandROI } from '../src/bands.js';

describe('Densitometry', () => {
  it('integratedIntensity sums ROI pixels', () => {
    const img = fromArray([
      1, 2, 3,
      4, 5, 6,
      7, 8, 9,
    ], 3, 3);
    const roi: BandROI = { lane: 0, y0: 0, y1: 2, x0: 0, x1: 2 };
    expect(integratedIntensity(img, roi)).toBe(1 + 2 + 4 + 5);
  });

  it('borderBackground computes border mean', () => {
    const img = fromArray([
      10, 10, 10,
      10, 100, 10,
      10, 10, 10,
    ], 3, 3);
    const roi: BandROI = { lane: 0, y0: 0, y1: 3, x0: 0, x1: 3 };
    const bg = borderBackground(img, roi);
    // border pixels: all 10 except center → mean = (10*8) / 8 = 10
    expect(bg).toBe(10);
  });

  it('measureBands returns corrected intensity', () => {
    const img = fromArray([
      5, 5, 5,
      5, 50, 5,
      5, 5, 5,
    ], 3, 3);
    const roi: BandROI = { lane: 0, y0: 0, y1: 3, x0: 0, x1: 3 };
    const results = measureBands(img, [roi]);
    expect(results.length).toBe(1);
    expect(results[0].rawIntensity).toBe(5 * 8 + 50);
    expect(results[0].backgroundPerPixel).toBe(5);
    expect(results[0].correctedIntensity).toBe(90 - 45);
  });
});
