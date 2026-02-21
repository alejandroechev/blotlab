import { describe, it, expect } from 'vitest';
import { createGrayImage, getPixel, setPixel, rgbaToGray, fromArray } from '../src/image.js';

describe('GrayImage', () => {
  it('creates image with correct dimensions and fill', () => {
    const img = createGrayImage(10, 5, 128);
    expect(img.width).toBe(10);
    expect(img.height).toBe(5);
    expect(img.data.length).toBe(50);
    expect(img.data[0]).toBe(128);
  });

  it('getPixel clamps to border', () => {
    const img = fromArray([1, 2, 3, 4], 2, 2);
    expect(getPixel(img, 0, 0)).toBe(1);
    expect(getPixel(img, 1, 0)).toBe(2);
    expect(getPixel(img, -1, 0)).toBe(1); // clamp left
    expect(getPixel(img, 5, 1)).toBe(4); // clamp right
  });

  it('setPixel writes correctly', () => {
    const img = createGrayImage(3, 3);
    setPixel(img, 1, 1, 200);
    expect(img.data[4]).toBe(200);
  });

  it('rgbaToGray converts using luminance weights', () => {
    // Pure white pixel: 0.299*255 + 0.587*255 + 0.114*255 = 255
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    const gray = rgbaToGray(rgba, 2, 1);
    expect(gray.data[0]).toBeCloseTo(255, 0);
    expect(gray.data[1]).toBeCloseTo(0, 0);
  });

  it('rgbaToGray preserves known channel values', () => {
    // Pure red: 0.299*255 = 76.245
    const rgba = new Uint8ClampedArray([255, 0, 0, 255]);
    const gray = rgbaToGray(rgba, 1, 1);
    expect(gray.data[0]).toBeCloseTo(76.245, 1);
  });

  it('fromArray creates image from flat array', () => {
    const img = fromArray([10, 20, 30, 40, 50, 60], 3, 2);
    expect(img.width).toBe(3);
    expect(img.height).toBe(2);
    expect(getPixel(img, 2, 1)).toBe(60);
  });

  it('fromArray throws on length mismatch', () => {
    expect(() => fromArray([1, 2, 3], 2, 2)).toThrow('Array length mismatch');
  });
});
