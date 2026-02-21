import { GrayImage } from './image.js';
import { BandROI } from './bands.js';

export interface BandIntensity {
  lane: number;
  bandIndex: number;
  rawIntensity: number;
  backgroundPerPixel: number;
  correctedIntensity: number;
}

/**
 * Compute integrated intensity for each band ROI.
 * Subtracts local background estimated from the border pixels of the ROI.
 */
export function measureBands(img: GrayImage, bands: BandROI[]): BandIntensity[] {
  const laneBandCount = new Map<number, number>();
  return bands.map((roi) => {
    const idx = laneBandCount.get(roi.lane) ?? 0;
    laneBandCount.set(roi.lane, idx + 1);

    const rawIntensity = integratedIntensity(img, roi);
    const bg = borderBackground(img, roi);
    const area = (roi.x1 - roi.x0) * (roi.y1 - roi.y0);
    const correctedIntensity = Math.max(0, rawIntensity - bg * area);

    return { lane: roi.lane, bandIndex: idx, rawIntensity, backgroundPerPixel: bg, correctedIntensity };
  });
}

/** Sum all pixel values within the ROI. */
export function integratedIntensity(img: GrayImage, roi: BandROI): number {
  let sum = 0;
  for (let y = roi.y0; y < roi.y1; y++) {
    for (let x = roi.x0; x < roi.x1; x++) {
      sum += img.data[y * img.width + x];
    }
  }
  return sum;
}

/** Mean intensity of the border pixels of the ROI (local background estimate). */
export function borderBackground(img: GrayImage, roi: BandROI): number {
  let sum = 0;
  let count = 0;

  // Top and bottom rows
  for (let x = roi.x0; x < roi.x1; x++) {
    sum += img.data[roi.y0 * img.width + x]; count++;
    if (roi.y1 - 1 > roi.y0) {
      sum += img.data[(roi.y1 - 1) * img.width + x]; count++;
    }
  }
  // Left and right columns (excluding corners already counted)
  for (let y = roi.y0 + 1; y < roi.y1 - 1; y++) {
    sum += img.data[y * img.width + roi.x0]; count++;
    if (roi.x1 - 1 > roi.x0) {
      sum += img.data[y * img.width + (roi.x1 - 1)]; count++;
    }
  }

  return count > 0 ? sum / count : 0;
}
