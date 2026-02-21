import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExportRow } from '@blotlab/engine';

interface ResultsPanelProps {
  exportRows: ExportRow[];
  chartData: { lane: number; value: number }[];
  controlBand: number;
  onControlBandChange: (b: number) => void;
  bandIndices: number[];
}

export function ResultsPanel({ exportRows, chartData, controlBand, onControlBandChange, bandIndices }: ResultsPanelProps) {
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
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.map((d) => ({ name: `Lane ${d.lane}`, value: Math.round(d.value * 1000) / 1000 }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
    </div>
  );
}
