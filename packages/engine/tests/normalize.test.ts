import { describe, it, expect } from 'vitest';
import { normalize } from '../src/normalize.js';
import { BandIntensity } from '../src/densitometry.js';

describe('Normalization', () => {
  it('normalizes bands to loading control', () => {
    const bands: BandIntensity[] = [
      { lane: 0, bandIndex: 0, rawIntensity: 1000, backgroundPerPixel: 0, correctedIntensity: 1000 }, // target
      { lane: 0, bandIndex: 1, rawIntensity: 500, backgroundPerPixel: 0, correctedIntensity: 500 },   // control
      { lane: 1, bandIndex: 0, rawIntensity: 2000, backgroundPerPixel: 0, correctedIntensity: 2000 }, // target
      { lane: 1, bandIndex: 1, rawIntensity: 500, backgroundPerPixel: 0, correctedIntensity: 500 },   // control
    ];

    const results = normalize(bands, 1, 0); // control band = row 1, control lane = 0
    expect(results.length).toBe(4);

    // Lane 0 target: 1000/500 = 2.0, fold = 2.0/2.0 = 1.0
    const lane0target = results.find(r => r.lane === 0 && r.bandIndex === 0)!;
    expect(lane0target.normalizedIntensity).toBe(2);
    expect(lane0target.foldChange).toBe(1);

    // Lane 1 target: 2000/500 = 4.0, fold = 4.0/2.0 = 2.0
    const lane1target = results.find(r => r.lane === 1 && r.bandIndex === 0)!;
    expect(lane1target.normalizedIntensity).toBe(4);
    expect(lane1target.foldChange).toBe(2);
  });

  it('handles zero control intensity gracefully', () => {
    const bands: BandIntensity[] = [
      { lane: 0, bandIndex: 0, rawIntensity: 100, backgroundPerPixel: 0, correctedIntensity: 100 },
      { lane: 0, bandIndex: 1, rawIntensity: 0, backgroundPerPixel: 0, correctedIntensity: 0 },
    ];
    const results = normalize(bands, 1, 0);
    expect(results[0].normalizedIntensity).toBe(0);
  });
});
