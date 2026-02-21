/**
 * GrayImage — 2D grayscale image stored as a flat Float64Array.
 */
export interface GrayImage {
  width: number;
  height: number;
  data: Float64Array;
}

/** Create a GrayImage filled with a constant value. */
export function createGrayImage(width: number, height: number, fill = 0): GrayImage {
  const data = new Float64Array(width * height);
  if (fill !== 0) data.fill(fill);
  return { width, height, data };
}

/** Get pixel value (clamped to border). */
export function getPixel(img: GrayImage, x: number, y: number): number {
  const cx = Math.max(0, Math.min(x, img.width - 1));
  const cy = Math.max(0, Math.min(y, img.height - 1));
  return img.data[cy * img.width + cx];
}

/** Set pixel value. */
export function setPixel(img: GrayImage, x: number, y: number, v: number): void {
  if (x >= 0 && x < img.width && y >= 0 && y < img.height) {
    img.data[y * img.width + x] = v;
  }
}

/**
 * Convert RGBA pixel data (Uint8ClampedArray from Canvas) to GrayImage.
 * Uses luminance weights: 0.299*R + 0.587*G + 0.114*B
 */
export function rgbaToGray(rgba: Uint8ClampedArray, width: number, height: number): GrayImage {
  const img = createGrayImage(width, height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    img.data[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return img;
}

/**
 * Create a GrayImage directly from a raw grayscale array (0-255).
 */
export function fromArray(values: number[], width: number, height: number): GrayImage {
  if (values.length !== width * height) throw new Error('Array length mismatch');
  const img = createGrayImage(width, height);
  for (let i = 0; i < values.length; i++) img.data[i] = values[i];
  return img;
}
