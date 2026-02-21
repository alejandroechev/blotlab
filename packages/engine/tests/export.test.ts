import { describe, it, expect } from 'vitest';
import { toExportRows, toCSV, toChartData } from '../src/export.js';
import { NormalizedResult } from '../src/normalize.js';

describe('Export', () => {
  const results: NormalizedResult[] = [
    { lane: 0, bandIndex: 0, rawIntensity: 1000, correctedIntensity: 900, normalizedIntensity: 1.8, foldChange: 1.0 },
    { lane: 1, bandIndex: 0, rawIntensity: 2000, correctedIntensity: 1800, normalizedIntensity: 3.6, foldChange: 2.0 },
  ];

  it('toExportRows formats correctly', () => {
    const rows = toExportRows(results);
    expect(rows.length).toBe(2);
    expect(rows[0].lane).toBe(0);
    expect(rows[0].normalizedIntensity).toBe(1.8);
  });

  it('toCSV generates valid CSV', () => {
    const csv = toCSV(toExportRows(results));
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Lane,Band,RawIntensity,CorrectedIntensity,NormalizedIntensity,FoldChange');
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain('0,0,1000');
  });

  it('toChartData filters by band index', () => {
    const data = toChartData(results, 0);
    expect(data.length).toBe(2);
    expect(data[0]).toEqual({ lane: 0, value: 1.8 });
    expect(data[1]).toEqual({ lane: 1, value: 3.6 });
  });
});
