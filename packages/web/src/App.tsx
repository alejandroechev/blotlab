import { useState, useCallback, useRef } from 'react';
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

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [grayImage, setGrayImage] = useState<GrayImage | null>(null);
  const [correctedImage, setCorrectedImage] = useState<GrayImage | null>(null);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [bands, setBands] = useState<BandROI[]>([]);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [exportRows, setExportRows] = useState<ExportRow[]>([]);
  const [chartData, setChartData] = useState<{ lane: number; value: number }[]>([]);
  const [controlBand, setControlBand] = useState(0);
  const [ballRadius, setBallRadius] = useState(50);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
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
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const loadSample = useCallback((id: string) => {
    const file = generateSampleImage(id);
    loadImage(file);
  }, [loadImage]);

  const runAutoDetect = useCallback(() => {
    if (!grayImage) return;
    const corrected = subtractBackground(grayImage, ballRadius);
    setCorrectedImage(corrected);
    const detectedLanes = detectLanes(corrected);
    setLanes(detectedLanes);
    const detectedBands = detectBands(corrected, detectedLanes);
    setBands(detectedBands);
  }, [grayImage, ballRadius]);

  const runNormalize = useCallback(() => {
    if (!correctedImage || bands.length === 0) return;
    const measured = measureBands(correctedImage, bands);
    const norm = normalize(measured, controlBand, 0);
    setResults(norm);
    setExportRows(toExportRows(norm));
    setChartData(toChartData(norm, 0));
  }, [correctedImage, bands, controlBand]);

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

  const downloadChart = useCallback(() => {
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

  // Derive unique band indices from the measured results
  const bandIndices = [...new Set(results.map((r) => r.bandIndex))];

  return (
    <div className="app" data-theme={theme}>
      <Toolbar
        onUpload={() => fileRef.current?.click()}
        onAutoDetect={runAutoDetect}
        onNormalize={runNormalize}
        onExportCSV={downloadCSV}
        onExportChart={downloadChart}
        onToggleTheme={toggleTheme}
        onLoadSample={loadSample}
        theme={theme}
        ballRadius={ballRadius}
        onBallRadiusChange={setBallRadius}
        laneCount={lanes.length}
        hasImage={!!grayImage}
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
          />
        )}
      </div>
    </div>
  );
}
