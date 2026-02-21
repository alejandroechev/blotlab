import { NormalizedResult } from './normalize.js';

export interface ExportRow {
  lane: number;
  band: number;
  rawIntensity: number;
  correctedIntensity: number;
  normalizedIntensity: number;
  foldChange: number;
}

/** Convert normalized results to export rows. */
export function toExportRows(results: NormalizedResult[]): ExportRow[] {
  return results.map((r) => ({
    lane: r.lane,
    band: r.bandIndex,
    rawIntensity: Math.round(r.rawIntensity * 100) / 100,
    correctedIntensity: Math.round(r.correctedIntensity * 100) / 100,
    normalizedIntensity: Math.round(r.normalizedIntensity * 10000) / 10000,
    foldChange: Math.round(r.foldChange * 10000) / 10000,
  }));
}

/** Generate CSV string from export rows. */
export function toCSV(rows: ExportRow[]): string {
  const header = 'Lane,Band,RawIntensity,CorrectedIntensity,NormalizedIntensity,FoldChange';
  const lines = rows.map(
    (r) => `${r.lane},${r.band},${r.rawIntensity},${r.correctedIntensity},${r.normalizedIntensity},${r.foldChange}`,
  );
  return [header, ...lines].join('\n');
}

/** Generate chart data for bar charts. */
export function toChartData(results: NormalizedResult[], bandIndex: number): { lane: number; value: number }[] {
  return results
    .filter((r) => r.bandIndex === bandIndex)
    .map((r) => ({ lane: r.lane, value: r.normalizedIntensity }));
}
