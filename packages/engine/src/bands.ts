import { GrayImage } from './image.js';
import { Lane } from './lanes.js';

export interface BandROI {
  /** Lane index. */
  lane: number;
  /** Top y boundary (inclusive). */
  y0: number;
  /** Bottom y boundary (exclusive). */
  y1: number;
  /** Left x boundary (from lane). */
  x0: number;
  /** Right x boundary (from lane). */
  x1: number;
}

/**
 * Auto-detect horizontal bands within each lane.
 * Computes horizontal intensity profile per lane and finds peaks.
 */
export function detectBands(img: GrayImage, lanes: Lane[], minBandHeight = 5): BandROI[] {
  const bands: BandROI[] = [];
  for (let li = 0; li < lanes.length; li++) {
    const lane = lanes[li];
    const profile = horizontalProfile(img, lane);
    const threshold = profileThreshold(profile);
    const regions = findPeakRegions(profile, threshold, minBandHeight);
    for (const [y0, y1] of regions) {
      bands.push({ lane: li, y0, y1, x0: lane.x0, x1: lane.x1 });
    }
  }
  return bands;
}

/** Compute horizontal intensity profile for a lane (sum each row within lane boundaries). */
export function horizontalProfile(img: GrayImage, lane: Lane): Float64Array {
  const profile = new Float64Array(img.height);
  for (let y = 0; y < img.height; y++) {
    let sum = 0;
    for (let x = lane.x0; x < lane.x1; x++) {
      sum += img.data[y * img.width + x];
    }
    profile[y] = sum;
  }
  return profile;
}

/** Threshold = mean + 0.5 * (max - mean). */
function profileThreshold(profile: Float64Array): number {
  let sum = 0, max = -Infinity;
  for (let i = 0; i < profile.length; i++) {
    sum += profile[i];
    if (profile[i] > max) max = profile[i];
  }
  const mean = sum / profile.length;
  return mean + 0.5 * (max - mean);
}

/** Find contiguous regions above threshold with minimum height. */
function findPeakRegions(profile: Float64Array, threshold: number, minHeight: number): [number, number][] {
  const regions: [number, number][] = [];
  let inPeak = false;
  let start = 0;
  for (let i = 0; i < profile.length; i++) {
    if (!inPeak && profile[i] > threshold) {
      inPeak = true;
      start = i;
    } else if (inPeak && profile[i] <= threshold) {
      inPeak = false;
      if (i - start >= minHeight) regions.push([start, i]);
    }
  }
  if (inPeak && profile.length - start >= minHeight) {
    regions.push([start, profile.length]);
  }
  return regions;
}
