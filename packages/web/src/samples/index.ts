export interface SampleDataset {
  id: string;
  name: string;
  description: string;
}

/** Draw a rectangular band on canvas context */
function drawBand(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  intensity: number, // 0 = black, 255 = white
) {
  ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
  ctx.fillRect(x, y, w, h);
}

/** Create a synthetic blot image and return as a File */
function generateBlotImage(
  width: number,
  height: number,
  painter: (ctx: OffscreenCanvasRenderingContext2D) => void,
  name: string,
): File {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  // Light gray background (like film/membrane)
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, width, height);

  painter(ctx);

  // Convert to PNG blob synchronously via ImageData workaround:
  // We'll build a BMP-like structure, but simplest is to return raw ImageData
  // Actually, OffscreenCanvas can't do toBlob synchronously.
  // Instead, we extract ImageData and build a minimal BMP.
  const imageData = ctx.getImageData(0, 0, width, height);
  const blob = buildBMP(imageData, width, height);
  return new File([blob], `${name}.bmp`, { type: 'image/bmp' });
}

/** Build a 24-bit BMP from ImageData (synchronous, no async needed) */
function buildBMP(imageData: ImageData, width: number, height: number): Blob {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows padded to 4 bytes
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);

  // BMP Header
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4D); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel data offset

  // DIB Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // negative = top-down
  view.setUint16(26, 1, true); // color planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelDataSize, true);

  // Pixel data (BGR, top-down)
  const rgba = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = 54 + y * rowSize + x * 3;
      view.setUint8(dstIdx, rgba[srcIdx + 2]);     // B
      view.setUint8(dstIdx + 1, rgba[srcIdx + 1]); // G
      view.setUint8(dstIdx + 2, rgba[srcIdx]);     // R
    }
  }

  return new Blob([buf], { type: 'image/bmp' });
}

/** Add slight noise to an intensity value */
function noisy(val: number, amount = 8): number {
  return Math.max(0, Math.min(255, val + (Math.random() - 0.5) * amount));
}

/** Paint gradient background noise across the canvas */
function paintBackground(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const base = d[i];
    const v = noisy(base, 6);
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imgData, 0, 0);
}

// ─── Sample definitions ───────────────────────────────────────────

const W = 400;
const H = 200;
const LANE_W = 60;
const BAND_H = 16;

function laneX(laneIdx: number, totalLanes: number): number {
  const margin = (W - totalLanes * LANE_W) / 2;
  return margin + laneIdx * LANE_W + (LANE_W - 40) / 2;
}

export const samples: SampleDataset[] = [
  {
    id: 'simple-4lane',
    name: 'Simple 4-lane blot',
    description: 'Clear bands with good contrast and GAPDH loading control',
  },
  {
    id: 'uneven-loading',
    name: 'Uneven loading',
    description: 'Varying band intensities requiring normalization',
  },
  {
    id: 'dose-response',
    name: 'Dose-response',
    description: 'Decreasing protein expression across lanes (drug treatment)',
  },
  {
    id: 'multi-band',
    name: 'Multi-band blot',
    description: 'Multiple protein targets at different molecular weights',
  },
  {
    id: 'low-contrast',
    name: 'Low contrast',
    description: 'Faint bands testing detection sensitivity',
  },
];

/** Generate the synthetic image File for a given sample id */
export function generateSampleImage(id: string): File {
  switch (id) {
    case 'simple-4lane':
      return generateBlotImage(W, H, (ctx) => {
        paintBackground(ctx, W, H);
        const lanes = 4;
        // Target band (row 1) — consistent intensity
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 50, 40, BAND_H, 40);  // dark band
        }
        // Loading control GAPDH (row 2) — consistent
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 130, 40, BAND_H, 50);
        }
      }, 'simple-4lane');

    case 'uneven-loading':
      return generateBlotImage(W, H, (ctx) => {
        paintBackground(ctx, W, H);
        const lanes = 5;
        const targetI = [35, 60, 30, 80, 45];   // target varies
        const loadingI = [50, 90, 40, 120, 60];  // loading control varies proportionally
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 50, 40, BAND_H, targetI[i]);
          drawBand(ctx, x, 130, 40, BAND_H, loadingI[i]);
        }
      }, 'uneven-loading');

    case 'dose-response':
      return generateBlotImage(W, H, (ctx) => {
        paintBackground(ctx, W, H);
        const lanes = 6;
        // Target protein decreases with drug dose
        const intensities = [30, 50, 80, 120, 170, 210]; // dark→light = high→low expression
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 50, 36, BAND_H, intensities[i]);
          drawBand(ctx, x, 130, 36, BAND_H, 55); // consistent loading control
        }
      }, 'dose-response');

    case 'multi-band':
      return generateBlotImage(W, 280, (ctx) => {
        paintBackground(ctx, W, 280);
        const lanes = 4;
        // Band 1 — high MW protein (~250 kDa region)
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 30, 40, BAND_H, noisy(45, 10));
        }
        // Band 2 — mid MW protein (~75 kDa region)
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 90, 40, BAND_H, noisy(55, 10));
        }
        // Band 3 — low MW protein (~25 kDa region)
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 155, 40, BAND_H, noisy(35, 10));
        }
        // Loading control — GAPDH (~37 kDa)
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 225, 40, BAND_H, 50);
        }
      }, 'multi-band');

    case 'low-contrast':
      return generateBlotImage(W, H, (ctx) => {
        paintBackground(ctx, W, H);
        const lanes = 4;
        // Very faint target bands — close to background
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 50, 40, BAND_H, 190); // barely darker than 232 bg
        }
        // Slightly more visible loading control
        for (let i = 0; i < lanes; i++) {
          const x = laneX(i, lanes);
          drawBand(ctx, x, 130, 40, BAND_H, 160);
        }
      }, 'low-contrast');

    default:
      throw new Error(`Unknown sample: ${id}`);
  }
}
