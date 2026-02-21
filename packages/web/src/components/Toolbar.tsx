interface ToolbarProps {
  onUpload: () => void;
  onAutoDetect: () => void;
  onNormalize: () => void;
  onExportCSV: () => void;
  onExportChart: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  ballRadius: number;
  onBallRadiusChange: (r: number) => void;
  laneCount: number;
  hasImage: boolean;
}

export function Toolbar({
  onUpload, onAutoDetect, onNormalize, onExportCSV, onExportChart,
  onToggleTheme, theme, ballRadius, onBallRadiusChange, laneCount, hasImage,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <h1>🧬 BlotLab</h1>
      <button onClick={onUpload}>📂 Upload</button>
      {hasImage && (
        <>
          <div className="radius-control">
            <span>Ball r:</span>
            <input
              type="number"
              min={1}
              max={200}
              value={ballRadius}
              onChange={(e) => onBallRadiusChange(Number(e.target.value))}
            />
          </div>
          <button onClick={onAutoDetect}>🔍 Auto-detect</button>
          <button onClick={onNormalize}>📊 Normalize</button>
          <button onClick={onExportCSV}>💾 CSV</button>
          <button onClick={onExportChart}>🖼️ Chart PNG</button>
          <span className="lane-info">{laneCount} lanes</span>
        </>
      )}
      <button onClick={onToggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
    </div>
  );
}
