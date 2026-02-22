import { samples } from '../samples/index.js';

interface ToolbarProps {
  onUpload: () => void;
  onAnalyze: () => void;
  onToggleTheme: () => void;
  onLoadSample: (id: string) => void;
  theme: 'light' | 'dark';
  ballRadius: number;
  onBallRadiusChange: (r: number) => void;
  hasImage: boolean;
  isProcessing: boolean;
}

export function Toolbar({
  onUpload, onAnalyze,
  onToggleTheme, onLoadSample, theme, ballRadius, onBallRadiusChange, hasImage, isProcessing,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <h1>🧬 BlotLab</h1>
      <button onClick={onUpload}>📂 Upload</button>
      <select
        className="sample-select"
        value=""
        onChange={(e) => { if (e.target.value) onLoadSample(e.target.value); }}
      >
        <option value="" disabled>🧪 Samples</option>
        {samples.map((s) => (
          <option key={s.id} value={s.id} title={s.description}>{s.name}</option>
        ))}
      </select>
      {hasImage && (
        <>
          <div className="radius-control">
            <span>r:</span>
            <input
              type="number"
              min={1}
              max={200}
              value={ballRadius}
              onChange={(e) => onBallRadiusChange(Number(e.target.value))}
            />
          </div>
          <button className="btn-analyze" onClick={onAnalyze} disabled={isProcessing}>
            {isProcessing ? '⏳ Processing…' : '▶ Analyze'}
          </button>
        </>
      )}
      <div className="toolbar-spacer" />
      <button onClick={() => window.open('/intro.html', '_blank')} title="Domain guide">📖 Guide</button>
      <button onClick={() => window.open('https://github.com/alejandroechev/blotlab/issues/new', '_blank')} title="Feedback">💬 Feedback</button>
      <button onClick={onToggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
    </div>
  );
}
