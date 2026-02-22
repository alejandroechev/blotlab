import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GrayImage, rgbaToGray, subtractBackground,
  detectLanes, detectBands, measureBands, normalize,
  toExportRows, toCSV, toChartData,
  Lane, BandROI, NormalizedResult, ExportRow,
} from '@blotlab/engine';
import { Toolbar } from './components/Toolbar.js';
import { generateSampleImage } from './samples/index.js';
import { CanvasPanel } from './components/CanvasPanel.js';
import { ResultsPanel } from './components/ResultsPanel.js';

const STORAGE_KEY = 'blotlab-state';

interface PersistedState {
  ballRadius: number;
  controlBand: number;
  lastSampleId?: string;
}

function loadPersisted(): PersistedState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { ballRadius: 50, controlBand: 0 };
}

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('blotlab-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'light';
}

export function App() {
  const persisted = useRef(loadPersisted());
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [grayImage, setGrayImage] = useState<GrayImage | null>(null);
  const [correctedImage, setCorrectedImage] = useState<GrayImage | null>(null);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [bands, setBands] = useState<BandROI[]>([]);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [exportRows, setExportRows] = useState<ExportRow[]>([]);
  const [chartData, setChartData] = useState<{ lane: number; value: number }[]>([]);
  const [controlBand, setControlBand] = useState(persisted.current.controlBand);
  const [ballRadius, setBallRadius] = useState(persisted.current.ballRadius);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSampleId, setLastSampleId] = useState<string | undefined>(persisted.current.lastSampleId);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-save settings to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state: PersistedState = { ballRadius, controlBand, lastSampleId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [ballRadius, controlBand, lastSampleId]);

  // Auto-load last sample on mount
  useEffect(() => {
    if (persisted.current.lastSampleId) {
      try {
        const file = generateSampleImage(persisted.current.lastSampleId);
        loadImage(file);
      } catch { /* sample not found */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('blotlab-theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const loadImage = useCallback(async (file: File) => {
    const bmp = await createImageBitmap(file);
    setImageBitmap(bmp);

    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const imageData = ctx.getImageData(0, 0, bmp.width, bmp.height);
    const gray = rgbaToGray(imageData.data, bmp.width, bmp.height);
    setGrayImage(gray);
    setCorrectedImage(null);
    setLanes([]);
    setBands([]);
    setResults([]);
    setExportRows([]);
    setChartData([]);
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLastSampleId(undefined); loadImage(file); }
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const loadSample = useCallback((id: string) => {
    const file = generateSampleImage(id);
    setLastSampleId(id);
    loadImage(file);
  }, [loadImage]);

  const runAnalyze = useCallback(() => {
    if (!grayImage) return;
    setIsProcessing(true);
    // Use setTimeout to let UI show processing state before heavy computation
    setTimeout(() => {
      const corrected = subtractBackground(grayImage, ballRadius);
      setCorrectedImage(corrected);
      const detectedLanes = detectLanes(corrected);
      setLanes(detectedLanes);
      const detectedBands = detectBands(corrected, detectedLanes);
      setBands(detectedBands);
      const measured = measureBands(corrected, detectedBands);
      const norm = normalize(measured, controlBand, 0);
      setResults(norm);
      setExportRows(toExportRows(norm));
      setChartData(toChartData(norm, 0));
      setIsProcessing(false);
    }, 0);
  }, [grayImage, ballRadius, controlBand]);

  const downloadCSV = useCallback(() => {
    const csv = toCSV(exportRows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blotlab-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportRows]);

  const downloadRawCSV = useCallback(() => {
    const header = 'Lane,Band,RawIntensity';
    const lines = exportRows.map((r) => `${r.lane},${r.band},${r.rawIntensity}`);
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blotlab-raw-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportRows]);

  const downloadChartSVG = useCallback(() => {
    const svg = document.querySelector('.chart-container svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blotlab-chart.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadChartPNG = useCallback(() => {
    const svg = document.querySelector('.chart-container svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'blotlab-chart.png';
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = url;
  }, []);

  // Derive unique band indices from the measured results
  const bandIndices = [...new Set(results.map((r) => r.bandIndex))];

  return (
    <div className="app" data-theme={theme}>
      <Toolbar
        onUpload={() => fileRef.current?.click()}
        onAnalyze={runAnalyze}
        onToggleTheme={toggleTheme}
        onLoadSample={loadSample}
        theme={theme}
        ballRadius={ballRadius}
        onBallRadiusChange={setBallRadius}
        hasImage={!!grayImage}
        isProcessing={isProcessing}
      />
      <input ref={fileRef} type="file" accept="image/*,.tif,.tiff" onChange={handleFile} className="hidden-input" />
      <div className="main">
        <CanvasPanel
          imageBitmap={imageBitmap}
          lanes={lanes}
          bands={bands}
          onDrop={handleDrop}
          hasImage={!!grayImage}
        />
        {results.length > 0 && (
          <ResultsPanel
            exportRows={exportRows}
            chartData={chartData}
            controlBand={controlBand}
            onControlBandChange={setControlBand}
            bandIndices={bandIndices}
            laneCount={lanes.length}
            onExportCSV={downloadCSV}
            onExportRawCSV={downloadRawCSV}
            onExportChartSVG={downloadChartSVG}
            onExportChartPNG={downloadChartPNG}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
