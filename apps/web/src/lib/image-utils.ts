/**
 * ALEGON AI Photo Studio — Utilitários de Imagem & Conversão Canvas
 * Conversão e download client-side em PNG, JPG e WebP sem compressão indesejada.
 */

export type ExportFormat = 'png' | 'jpg' | 'webp';

/**
 * Carrega uma URL de imagem ou Blob em um HTMLImageElement com crossOrigin anônimo
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Falha ao carregar a imagem para renderização: ' + e));
    img.src = src;
  });
}

/**
 * Gera miniatura WebP no navegador via Canvas para envio otimizado no upload
 */
export async function generateThumbnail(
  fileOrBlob: Blob,
  maxWidth: number = 400,
  maxHeight: number = 400
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(fileOrBlob);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não suportado');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao exportar miniatura WebP'));
        },
        'image/webp',
        0.85
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Converte instantaneamente a imagem no navegador para PNG, JPG ou WebP e dispara download
 */
export async function convertAndDownload(
  sourceUrl: string,
  baseFilename: string,
  format: ExportFormat,
  quality: number = 0.95
): Promise<void> {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar Canvas para conversão');

  // Para JPG, preenche fundo branco caso haja transparência
  if (format === 'jpg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0);

  const mimeMap: Record<ExportFormat, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
  };

  const extensionMap: Record<ExportFormat, string> = {
    png: '.png',
    jpg: '.jpg',
    webp: '.webp',
  };

  const cleanName = baseFilename.replace(/\.[^/.]+$/, '');
  const finalFilename = `${cleanName}_alegon${extensionMap[format]}`;

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao converter imagem para ' + format.toUpperCase()));
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
        resolve();
      },
      mimeMap[format],
      quality
    );
  });
}
