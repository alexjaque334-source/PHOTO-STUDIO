import { describe, expect, it } from 'vitest';
import { DomainError } from '../contracts';
import {
  MAX_FILE_SIZE_BYTES,
  MIN_DIMENSION_PX,
  validateImageUpload,
} from './upload';

// Helper para criar buffer de PNG válido com dimensões customizadas
function createPngBuffer(width: number, height: number): ArrayBuffer {
  const buffer = new ArrayBuffer(33);
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Magic bytes PNG
  u8.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);

  // IHDR chunk length = 13
  view.setUint32(8, 13, false);
  // 'IHDR'
  u8.set([0x49, 0x48, 0x44, 0x52], 12);
  // Width
  view.setUint32(16, width, false);
  // Height
  view.setUint32(20, height, false);
  // Bit depth 8, truecolor 2, comp 0, filter 0, interlace 0
  u8.set([8, 2, 0, 0, 0], 24);
  // Dummy CRC
  view.setUint32(29, 0x12345678, false);

  return buffer;
}

// Helper para criar buffer de JPEG válido com dimensões customizadas
function createJpegBuffer(width: number, height: number): ArrayBuffer {
  const buffer = new ArrayBuffer(20);
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // SOI (0xFF, 0xD8)
  u8[0] = 0xff;
  u8[1] = 0xd8;

  // SOF0 Marker (0xFF, 0xC0)
  u8[2] = 0xff;
  u8[3] = 0xc0;

  // Segment length (8 + 3 = 11 bytes)
  view.setUint16(4, 11, false);
  // Precision (8 bits)
  u8[6] = 8;
  // Height
  view.setUint16(7, height, false);
  // Width
  view.setUint16(9, width, false);
  // Number of components (3)
  u8[11] = 3;

  return buffer;
}

// Helper para criar buffer de WebP válido (VP8)
function createWebpBuffer(width: number, height: number): ArrayBuffer {
  const buffer = new ArrayBuffer(32);
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // 'RIFF'
  u8.set([0x52, 0x49, 0x46, 0x46], 0);
  // File size - 8
  view.setUint32(4, 24, true);
  // 'WEBP'
  u8.set([0x57, 0x45, 0x42, 0x50], 8);
  // 'VP8 '
  u8.set([0x56, 0x50, 0x38, 0x20], 12);
  // Chunk size
  view.setUint32(16, 12, true);
  // 3 bytes frame tag
  u8.set([0x00, 0x00, 0x00], 20);
  // 3 bytes start code 0x9D 0x01 0x2A
  u8.set([0x9d, 0x01, 0x2a], 23);
  // 2 bytes width LE (14 bits)
  u8[26] = width & 0xff;
  u8[27] = (width >> 8) & 0x3f;
  // 2 bytes height LE (14 bits)
  u8[28] = height & 0xff;
  u8[29] = (height >> 8) & 0x3f;

  return buffer;
}

describe('validateImageUpload', () => {
  it('validates and extracts PNG image metadata', () => {
    const png = createPngBuffer(800, 600);
    const result = validateImageUpload(png, 'image/png');

    expect(result.mime).toBe('image/png');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.sizeBytes).toBe(33);
  });

  it('validates and extracts JPEG image metadata', () => {
    const jpeg = createJpegBuffer(1920, 1080);
    const result = validateImageUpload(jpeg, 'image/jpeg');

    expect(result.mime).toBe('image/jpeg');
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('validates and extracts WebP image metadata', () => {
    const webp = createWebpBuffer(1024, 768);
    const result = validateImageUpload(webp, 'image/webp');

    expect(result.mime).toBe('image/webp');
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
  });

  it('rejects empty file', () => {
    expect(() => validateImageUpload(new ArrayBuffer(0))).toThrow(DomainError);
    try {
      validateImageUpload(new ArrayBuffer(0));
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_EMPTY');
      expect(e.status).toBe(400);
    }
  });

  it('rejects files larger than 15 MB', () => {
    // Simula tamanho acima de 15 MB sem alocar 16 MB reais na memória criando mock de slice/byteLength
    const largeMock = {
      byteLength: MAX_FILE_SIZE_BYTES + 1024,
      slice: () => new ArrayBuffer(0),
    } as unknown as ArrayBuffer;

    expect(() => validateImageUpload(largeMock)).toThrowError(DomainError);
    try {
      validateImageUpload(largeMock);
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_TOO_LARGE');
      expect(e.status).toBe(413);
    }
  });

  it('rejects images smaller than 64x64 px', () => {
    const smallPng = createPngBuffer(32, 32);
    try {
      validateImageUpload(smallPng);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_DIMENSIONS_TOO_SMALL');
      expect(e.status).toBe(422);
    }
  });

  it('rejects images exceeding 40 megapixels', () => {
    const hugeJpeg = createJpegBuffer(8000, 6000); // 48 megapixels
    try {
      validateImageUpload(hugeJpeg);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_PIXELS_TOO_LARGE');
      expect(e.status).toBe(422);
    }
  });

  it('rejects MIME mismatch', () => {
    const png = createPngBuffer(200, 200);
    try {
      validateImageUpload(png, 'image/jpeg');
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_MIME_MISMATCH');
      expect(e.status).toBe(415);
    }
  });

  it('rejects polyglot SVG/HTML/script embedded in file', () => {
    const png = createPngBuffer(200, 200);
    // Injeta tag <svg no buffer
    const u8 = new Uint8Array(png);
    const injection = new TextEncoder().encode('<svg onload=alert(1)>');
    u8.set(injection, 10);

    try {
      validateImageUpload(png);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_INVALID_CONTENT');
      expect(e.status).toBe(415);
    }
  });
});
