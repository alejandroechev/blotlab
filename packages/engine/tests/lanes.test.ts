import { describe, it, expect } from 'vitest';
import { detectLanes, verticalProjection, splitIntoEqualLanes } from '../src/lanes.js';
import { fromArray, createGrayImage } from '../src/image.js';

describe('Lane Detection', () => {
  it('verticalProjection sums columns correctly', () => {
    // 3×2: row0=[1,2,3], row1=[4,5,6] → col sums [5,7,9]
    const img = fromArray([1, 2, 3, 4, 5, 6], 3, 2);
    const proj = verticalProjection(img);
    expect(proj[0]).toBe(5);
    expect(proj[1]).toBe(7);
    expect(proj[2]).toBe(9);
  });

  it('splitIntoEqualLanes divides evenly', () => {
    const lanes = splitIntoEqualLanes(100, 4);
    expect(lanes.length).toBe(4);
    expect(lanes[0]).toEqual({ x0: 0, x1: 25 });
    expect(lanes[3]).toEqual({ x0: 75, x1: 100 });
  });

  it('detects lanes in synthetic blot with bright columns', () => {
    // 40×10 image: columns 2-8 bright, 12-18 bright, 22-28 bright, 32-38 bright
    const data = new Array(400).fill(10);
    const laneRanges = [[2, 8], [12, 18], [22, 28], [32, 38]];
    for (let y = 0; y < 10; y++) {
      for (const [x0, x1] of laneRanges) {
        for (let x = x0; x <= x1; x++) {
          data[y * 40 + x] = 200;
        }
      }
    }
    const img = fromArray(data, 40, 10);
    const lanes = detectLanes(img);
    expect(lanes.length).toBeGreaterThanOrEqual(4);
  });

  it('falls back to equal lanes when expected count mismatches', () => {
    const img = createGrayImage(100, 10, 128); // uniform → no clear lanes
    const lanes = detectLanes(img, 5);
    expect(lanes.length).toBe(5);
  });
});
