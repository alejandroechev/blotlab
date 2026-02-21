import { useRef, useEffect } from 'react';
import { Lane, BandROI } from '@blotlab/engine';

interface CanvasPanelProps {
  imageBitmap: ImageBitmap | null;
  lanes: Lane[];
  bands: BandROI[];
  onDrop: (e: React.DragEvent) => void;
  hasImage: boolean;
}

export function CanvasPanel({ imageBitmap, lanes, bands, onDrop, hasImage }: CanvasPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageBitmap) return;
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d')!;

    // Draw image
    ctx.drawImage(imageBitmap, 0, 0);

    // Draw lane boundaries
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    for (const lane of lanes) {
      ctx.beginPath();
      ctx.moveTo(lane.x0, 0);
      ctx.lineTo(lane.x0, imageBitmap.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lane.x1, 0);
      ctx.lineTo(lane.x1, imageBitmap.height);
      ctx.stroke();
    }

    // Draw band ROIs
    ctx.setLineDash([]);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    for (const band of bands) {
      ctx.strokeRect(band.x0, band.y0, band.x1 - band.x0, band.y1 - band.y0);
    }
  }, [imageBitmap, lanes, bands]);

  if (!hasImage) {
    return (
      <div
        className="canvas-panel"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="drop-zone">
          <span style={{ fontSize: 48 }}>📁</span>
          <span>Drop a blot image here or click Upload</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Supports TIFF, PNG, JPEG</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="canvas-panel"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
