import { GrayImage, createGrayImage, getPixel } from './image.js';

/**
 * Rolling ball background subtraction (ImageJ-style).
 * 1. Erode with a spherical structuring element of given radius.
 * 2. Dilate the eroded result with the same element.
 * 3. Subtract the background from the original.
 */
export function rollingBallBackground(img: GrayImage, radius: number): GrayImage {
  const ball = buildBall(radius);
  const eroded = erode(img, ball, radius);
  const background = dilate(eroded, ball, radius);
  return background;
}

export function subtractBackground(img: GrayImage, radius: number): GrayImage {
  const bg = rollingBallBackground(img, radius);
  const result = createGrayImage(img.width, img.height);
  for (let i = 0; i < img.data.length; i++) {
    result.data[i] = Math.max(0, img.data[i] - bg.data[i]);
  }
  return result;
}

/** Build the ball (hemisphere) heights for the structuring element. */
function buildBall(radius: number): Float64Array {
  const size = 2 * radius + 1;
  const ball = new Float64Array(size * size);
  const r2 = radius * radius;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const d2 = x * x + y * y;
      ball[(y + radius) * size + (x + radius)] = d2 <= r2 ? Math.sqrt(r2 - d2) : 0;
    }
  }
  return ball;
}

/** Morphological erosion: minimum of (pixel - ball height). */
function erode(img: GrayImage, ball: Float64Array, radius: number): GrayImage {
  const out = createGrayImage(img.width, img.height);
  const size = 2 * radius + 1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let minVal = Infinity;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const bh = ball[(dy + radius) * size + (dx + radius)];
          if (bh === 0 && (dx * dx + dy * dy) > radius * radius) continue;
          const pv = getPixel(img, x + dx, y + dy);
          minVal = Math.min(minVal, pv - bh);
        }
      }
      out.data[y * img.width + x] = minVal;
    }
  }
  return out;
}

/** Morphological dilation: maximum of (pixel + ball height). */
function dilate(img: GrayImage, ball: Float64Array, radius: number): GrayImage {
  const out = createGrayImage(img.width, img.height);
  const size = 2 * radius + 1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let maxVal = -Infinity;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const bh = ball[(dy + radius) * size + (dx + radius)];
          if (bh === 0 && (dx * dx + dy * dy) > radius * radius) continue;
          const pv = getPixel(img, x + dx, y + dy);
          maxVal = Math.max(maxVal, pv + bh);
        }
      }
      out.data[y * img.width + x] = maxVal;
    }
  }
  return out;
}
