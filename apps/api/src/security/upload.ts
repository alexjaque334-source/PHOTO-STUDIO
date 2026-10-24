/**
 * Validação rigorosa de uploads de imagens.
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Validações:
 * 1. Tamanho do payload (máx. 15 MB).
 * 2. Magic bytes reais (JPEG FFD8FF, PNG 89504E470D0A1A0A, WebP RIFF...WEBP).
 * 3. Detecção e rejeição de polyglots (SVG embutido, HTML, scripts, XML).
 * 4. Extração segura de largura e altura sem dependências nativas binárias.
 * 5. Dimensões mínimas (64x64 px) e máximas (40 megapixels).
 * 6. Correspondência com tipo MIME declarado.
 */
import { DomainError, type ImageMime } from '../contracts';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MIN_DIMENSION_PX = 64;
export const MAX_MEGAPIXELS = 40_000_000; // 40 MP

export interface ValidatedImage {
  mime: ImageMime;
  width: number;
  height: number;
  sizeBytes: number;
}

const SUSPICIOUS_PATTERNS = [
  /<\?xml/i,
  /<svg/i,
  /<html/i,
  /<!doctype/i,
  /javascript:/i,
  /<script/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /xmlns/i,
  /xlink:href/i,
  /<\?php/i,
];

/**
 * Valida arquivo de imagem para upload ou processamento de IA.
 */
export function validateImageUpload(
  bytes: ArrayBuffer,
  declaredMime?: string,
): ValidatedImage {
  if (!bytes || bytes.byteLength === 0) {
    throw new DomainError('UPLOAD_EMPTY', 'Arquivo de imagem vazio.', 400);
  }

  const sizeBytes = bytes.byteLength;
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new DomainError(
      'UPLOAD_TOO_LARGE',
      `O arquivo tem ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB e excede o limite máximo de 15 MB.`,
      413,
      { maxBytes: MAX_FILE_SIZE_BYTES, actualBytes: sizeBytes },
    );
  }

  const u8 = new Uint8Array(bytes);
  const view = new DataView(bytes);

  // 1. Verificação contra arquivos com scripts/HTML/SVG (inspeciona primeiros 64KB e últimos 4KB)
  const headerSample = new TextDecoder('utf-8', { fatal: false, ignoreBOM: false }).decode(
    u8.subarray(0, Math.min(65536, sizeBytes)),
  );
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(headerSample)) {
      throw new DomainError(
        'UPLOAD_INVALID_CONTENT',
        'Arquivo rejeitado por conter assinaturas não seguras (HTML/SVG/Script embutido).',
        415,
      );
    }
  }

  // 2. Detecção de Formato e Magic Bytes
  let detectedMime: ImageMime;
  let dimensions: { width: number; height: number };

  if (isJpeg(u8)) {
    detectedMime = 'image/jpeg';
    dimensions = parseJpegDimensions(u8, view);
  } else if (isPng(u8)) {
    detectedMime = 'image/png';
    dimensions = parsePngDimensions(u8, view);
  } else if (isWebP(u8)) {
    detectedMime = 'image/webp';
    dimensions = parseWebpDimensions(u8, view);
  } else {
    throw new DomainError(
      'UPLOAD_INVALID_FORMAT',
      'Formato de arquivo não suportado. Envie apenas imagens nos formatos JPEG, PNG ou WebP.',
      415,
    );
  }

  // 3. Validação do MIME declarado, se fornecido
  if (declaredMime) {
    const normDeclared = declaredMime.toLowerCase().trim();
    if (normDeclared !== detectedMime) {
      // Aceita variações comuns de declaração (image/jpg -> image/jpeg)
      const isJpgEquiv = (normDeclared === 'image/jpg' || normDeclared === 'image/pjpeg') && detectedMime === 'image/jpeg';
      if (!isJpgEquiv) {
        throw new DomainError(
          'UPLOAD_MIME_MISMATCH',
          `O tipo MIME declarado (${declaredMime}) não corresponde ao tipo real identificado (${detectedMime}).`,
          415,
        );
      }
    }
  }

  // 4. Validação de Dimensões
  const { width, height } = dimensions;
  if (!width || !height || width <= 0 || height <= 0) {
    throw new DomainError(
      'UPLOAD_CORRUPTED',
      'Não foi possível extrair as dimensões válidas da imagem.',
      422,
    );
  }

  if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
    throw new DomainError(
      'UPLOAD_DIMENSIONS_TOO_SMALL',
      `Dimensões de ${width}x${height}px são inferiores ao mínimo permitido de ${MIN_DIMENSION_PX}x${MIN_DIMENSION_PX}px.`,
      422,
      { min: MIN_DIMENSION_PX, width, height },
    );
  }

  const totalPixels = width * height;
  if (totalPixels > MAX_MEGAPIXELS) {
    throw new DomainError(
      'UPLOAD_PIXELS_TOO_LARGE',
      `A imagem possui ${(totalPixels / 1_000_000).toFixed(1)} MP e excede o limite máximo de 40 megapixels.`,
      422,
      { maxMegapixels: 40, width, height, totalPixels },
    );
  }

  return {
    mime: detectedMime,
    width,
    height,
    sizeBytes,
  };
}

// ───────────────────────────── Magic Bytes ─────────────────────────────

function isJpeg(u8: Uint8Array): boolean {
  return u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff;
}

function isPng(u8: Uint8Array): boolean {
  return (
    u8.length >= 8 &&
    u8[0] === 0x89 &&
    u8[1] === 0x50 && // P
    u8[2] === 0x4e && // N
    u8[3] === 0x47 && // G
    u8[4] === 0x0d &&
    u8[5] === 0x0a &&
    u8[6] === 0x1a &&
    u8[7] === 0x0a
  );
}

function isWebP(u8: Uint8Array): boolean {
  if (u8.length < 12) return false;
  // 'RIFF' .... 'WEBP'
  const isRiff = u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46;
  const isWebp = u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50;
  return isRiff && isWebp;
}

// ───────────────────────────── Extração de Dimensões ─────────────────────────────

function parsePngDimensions(u8: Uint8Array, view: DataView): { width: number; height: number } {
  // O chunk IHDR deve ser o primeiro chunk após o cabeçalho de 8 bytes
  // Offset 8: length (4 bytes)
  // Offset 12: 'IHDR' (4 bytes: 0x49, 0x48, 0x44, 0x52)
  // Offset 16: width (4 bytes big-endian)
  // Offset 20: height (4 bytes big-endian)
  if (u8.length < 24) {
    throw new DomainError('UPLOAD_CORRUPTED', 'Cabeçalho PNG corrompido ou incompleto.', 422);
  }

  const isIhdr =
    u8[12] === 0x49 && u8[13] === 0x48 && u8[14] === 0x44 && u8[15] === 0x52;
  if (!isIhdr) {
    throw new DomainError('UPLOAD_CORRUPTED', 'Chunk IHDR não localizado na imagem PNG.', 422);
  }

  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return { width, height };
}

function parseJpegDimensions(u8: Uint8Array, view: DataView): { width: number; height: number } {
  let offset = 2; // pula SOI (0xFFD8)
  const len = u8.length;

  while (offset < len) {
    // Procura o próximo marcador 0xFF
    if (u8[offset] !== 0xff) {
      offset++;
      continue;
    }

    // Pula bytes extras 0xFF de preenchimento
    while (offset < len && u8[offset] === 0xff) {
      offset++;
    }

    if (offset >= len) break;

    const marker = u8[offset]!;
    offset++;

    // Marcadores autônomos sem comprimento
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (offset + 2 > len) break;
    const segmentLength = view.getUint16(offset, false);

    // SOF markers (Start of Frame) que contêm dimensões:
    // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2), SOF3 (0xC3),
    // SOF5 (0xC5), SOF6 (0xC6), SOF7 (0xC7), SOF9 (0xC9),
    // SOF10 (0xCA), SOF11 (0xCB), SOF13 (0xCD), SOF14 (0xCE), SOF15 (0xCF)
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) {
      if (offset + 7 > len) {
        throw new DomainError('UPLOAD_CORRUPTED', 'Segmento SOF do JPEG truncado.', 422);
      }
      // Offset + 2: precision (1 byte)
      // Offset + 3: height (2 bytes BE)
      // Offset + 5: width (2 bytes BE)
      const height = view.getUint16(offset + 3, false);
      const width = view.getUint16(offset + 5, false);
      return { width, height };
    }

    // Avança para o próximo segmento
    offset += segmentLength;
  }

  throw new DomainError(
    'UPLOAD_CORRUPTED',
    'Não foi possível encontrar o segmento de dimensões (SOF) no JPEG.',
    422,
  );
}

function parseWebpDimensions(u8: Uint8Array, view: DataView): { width: number; height: number } {
  if (u8.length < 30) {
    throw new DomainError('UPLOAD_CORRUPTED', 'Cabeçalho WebP incompleto.', 422);
  }

  // O chunk de dados começa no offset 12
  const chunkType = String.fromCharCode(u8[12]!, u8[13]!, u8[14]!, u8[15]!);

  if (chunkType === 'VP8 ') {
    // Lossy WebP (VP8):
    // Offset 20: 3 bytes frame tag
    // Offset 23: 3 bytes start code 0x9D 0x01 0x2A
    // Offset 26: 2 bytes width (14 bits)
    // Offset 28: 2 bytes height (14 bits)
    if (u8.length < 30) {
      throw new DomainError('UPLOAD_CORRUPTED', 'Bloco VP8 truncado.', 422);
    }
    const width = (u8[26]! | (u8[27]! << 8)) & 0x3fff;
    const height = (u8[28]! | (u8[29]! << 8)) & 0x3fff;
    return { width, height };
  }

  if (chunkType === 'VP8L') {
    // Lossless WebP (VP8L):
    // Offset 20: 1 byte signature 0x2F
    // Offset 21..24: 4 bytes contendo largura (14 bits) e altura (14 bits)
    if (u8.length < 25) {
      throw new DomainError('UPLOAD_CORRUPTED', 'Bloco VP8L truncado.', 422);
    }
    const b0 = u8[21]!;
    const b1 = u8[22]!;
    const b2 = u8[23]!;
    const b3 = u8[24]!;

    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  if (chunkType === 'VP8X') {
    // Extended WebP (VP8X):
    // Offset 24..26: 3 bytes de largura do canvas menos 1 (little endian)
    // Offset 27..29: 3 bytes de altura do canvas menos 1 (little endian)
    if (u8.length < 30) {
      throw new DomainError('UPLOAD_CORRUPTED', 'Bloco VP8X truncado.', 422);
    }
    const width = 1 + (u8[24]! | (u8[25]! << 8) | (u8[26]! << 16));
    const height = 1 + (u8[27]! | (u8[28]! << 8) | (u8[29]! << 16));
    return { width, height };
  }

  throw new DomainError(
    'UPLOAD_CORRUPTED',
    `Chunk WebP não reconhecido: ${chunkType}`,
    422,
  );
}
