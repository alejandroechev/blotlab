import { BandIntensity } from './densitometry.js';

export interface NormalizedResult {
  lane: number;
  bandIndex: number;
  rawIntensity: number;
  correctedIntensity: number;
  normalizedIntensity: number;
  foldChange: number;
}

/**
 * Normalize band intensities to a loading control band row.
 * @param bands - measured band intensities
 * @param controlBandIndex - which band row is the loading control (e.g., 0 = first band row)
 * @param controlLane - which lane is the reference for fold change (default 0)
 */
export function normalize(
  bands: BandIntensity[],
  controlBandIndex: number,
  controlLane = 0,
): NormalizedResult[] {
  // Build map: lane → control band intensity
  const controlMap = new Map<number, number>();
  for (const b of bands) {
    if (b.bandIndex === controlBandIndex) {
      controlMap.set(b.lane, b.correctedIntensity);
    }
  }

  // Normalize each non-control band
  const results: NormalizedResult[] = [];
  for (const b of bands) {
    const controlIntensity = controlMap.get(b.lane) ?? 1;
    const normalizedIntensity = controlIntensity > 0 ? b.correctedIntensity / controlIntensity : 0;
    results.push({
      lane: b.lane,
      bandIndex: b.bandIndex,
      rawIntensity: b.rawIntensity,
      correctedIntensity: b.correctedIntensity,
      normalizedIntensity,
      foldChange: 0, // computed below
    });
  }

  // Compute fold change relative to control lane
  const controlLaneNorm = new Map<number, number>();
  for (const r of results) {
    if (r.lane === controlLane) controlLaneNorm.set(r.bandIndex, r.normalizedIntensity);
  }
  for (const r of results) {
    const ref = controlLaneNorm.get(r.bandIndex) ?? 1;
    r.foldChange = ref > 0 ? r.normalizedIntensity / ref : 0;
  }

  return results;
}
