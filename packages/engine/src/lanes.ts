import { GrayImage } from './image.js';

export interface Lane {
  /** Left x boundary (inclusive). */
  x0: number;
  /** Right x boundary (exclusive). */
  x1: number;
}

/**
 * Auto-detect lane boundaries by analysing the vertical intensity projection.
 * Sums each column → finds valleys between bright lane regions.
 */
export function detectLanes(img: GrayImage, expectedCount?: number): Lane[] {
  const projection = verticalProjection(img);
  const smoothed = smooth1D(projection, 5);
  const threshold = computeThreshold(smoothed);
  const lanes = findLaneRegions(smoothed, threshold);

  if (expectedCount && lanes.length !== expectedCount) {
    return splitIntoEqualLanes(img.width, expectedCount);
  }
  return lanes.length > 0 ? lanes : splitIntoEqualLanes(img.width, expectedCount ?? 4);
}

/** Sum pixel intensities down each column. */
export function verticalProjection(img: GrayImage): Float64Array {
  const proj = new Float64Array(img.width);
  for (let x = 0; x < img.width; x++) {
    let sum = 0;
    for (let y = 0; y < img.height; y++) {
      sum += img.data[y * img.width + x];
    }
    proj[x] = sum;
  }
  return proj;
}

/** Simple moving average. */
function smooth1D(data: Float64Array, windowSize: number): Float64Array {
  const out = new Float64Array(data.length);
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < data.length) { sum += data[j]; count++; }
    }
    out[i] = sum / count;
  }
  return out;
}

/** Otsu-like threshold: mean of projection. */
function computeThreshold(proj: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < proj.length; i++) sum += proj[i];
  return sum / proj.length;
}

/** Find contiguous regions above threshold → lanes. */
function findLaneRegions(proj: Float64Array, threshold: number): Lane[] {
  const lanes: Lane[] = [];
  let inLane = false;
  let start = 0;
  for (let i = 0; i < proj.length; i++) {
    if (!inLane && proj[i] > threshold) {
      inLane = true;
      start = i;
    } else if (inLane && proj[i] <= threshold) {
      inLane = false;
      lanes.push({ x0: start, x1: i });
    }
  }
  if (inLane) lanes.push({ x0: start, x1: proj.length });
  return lanes;
}

/** Fallback: divide image into equal lanes. */
export function splitIntoEqualLanes(width: number, count: number): Lane[] {
  const laneWidth = Math.floor(width / count);
  const lanes: Lane[] = [];
  for (let i = 0; i < count; i++) {
    lanes.push({ x0: i * laneWidth, x1: (i + 1) * laneWidth });
  }
  // Extend last lane to cover remaining pixels
  if (lanes.length > 0) lanes[lanes.length - 1].x1 = width;
  return lanes;
}
