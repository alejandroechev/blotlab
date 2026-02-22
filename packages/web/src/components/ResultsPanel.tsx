import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExportRow } from '@blotlab/engine';

interface ResultsPanelProps {
  exportRows: ExportRow[];
  chartData: { lane: number; value: number }[];
  controlBand: number;
  onControlBandChange: (b: number) => void;
  bandIndices: number[];
  laneCount: number;
  onExportCSV: () => void;
  onExportRawCSV: () => void;
  onExportChartSVG: () => void;
  onExportChartPNG: () => void;
  theme: 'light' | 'dark';
}

export function ResultsPanel({
  exportRows, chartData, controlBand, onControlBandChange, bandIndices,
  laneCount, onExportCSV, onExportRawCSV, onExportChartSVG, onExportChartPNG, theme,
}: ResultsPanelProps) {
  const textColor = theme === 'dark' ? '#e2e8f0' : '#1a1a1a';
  const gridColor = theme === 'dark' ? '#334155' : '#ccc';

  return (
    <div className="results-panel">
      <h2>Results</h2>

      <div className="controls">
        <label>
          Loading control band:
          <select value={controlBand} onChange={(e) => onControlBandChange(Number(e.target.value))}>
            {bandIndices.map((i) => (
              <option key={i} value={i}>Band {i}</option>
            ))}
          </select>
        </label>
        <span className="lane-info">{laneCount} lanes detected</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.map((d) => ({ name: `Lane ${d.lane}`, value: Math.round(d.value * 1000) / 1000 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" fontSize={11} tick={{ fill: textColor }} />
            <YAxis fontSize={11} tick={{ fill: textColor }} />
            <Tooltip
              contentStyle={{ background: theme === 'dark' ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, color: textColor }}
              labelStyle={{ color: textColor }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="inline-export-row">
        <button className="btn-inline-export" onClick={onExportChartPNG}>🖼 PNG</button>
        <button className="btn-inline-export" onClick={onExportChartSVG}>📐 SVG</button>
      </div>

      <h2>Data Table</h2>
      <table>
        <thead>
          <tr>
            <th>Lane</th>
            <th>Band</th>
            <th>Raw</th>
            <th>Corrected</th>
            <th>Normalized</th>
            <th>Fold</th>
          </tr>
        </thead>
        <tbody>
          {exportRows.map((r, i) => (
            <tr key={i}>
              <td>{r.lane}</td>
              <td>{r.band}</td>
              <td>{r.rawIntensity}</td>
              <td>{r.correctedIntensity}</td>
              <td>{r.normalizedIntensity}</td>
              <td>{r.foldChange}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="inline-export-row">
        <button className="btn-inline-export" onClick={onExportCSV}>📄 CSV</button>
        <button className="btn-inline-export" onClick={onExportRawCSV}>📄 Raw CSV</button>
      </div>
    </div>
  );
}
