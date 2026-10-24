import React, { useRef, useState } from 'react';
import { cn } from './cn';
import { UploadCloud, Camera, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface DropzoneProps {
  onFileSelect: (file: File) => void;
  maxSizeMB?: number;
  acceptedMimeTypes?: string[];
  currentPreviewUrl?: string | null;
  onClearPreview?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  maxSizeMB = 15,
  acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
  currentPreviewUrl,
  onClearPreview,
  disabled = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndDispatch = (file: File) => {
    setValidationError(null);

    if (!acceptedMimeTypes.includes(file.type)) {
      setValidationError('Formato inválido. Aceitamos apenas JPG, PNG ou WebP.');
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(`Arquivo muito grande. O limite máximo é de ${maxSizeMB} MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndDispatch(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndDispatch(e.target.files[0]);
      e.target.value = ''; // Permite selecionar o mesmo arquivo novamente
    }
  };

  if (currentPreviewUrl) {
    return (
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden border border-border bg-card/80 p-2 flex flex-col items-center justify-center group',
          className
        )}
      >
        <img
          src={currentPreviewUrl}
          alt="Pré-visualização do upload"
          className="max-h-[380px] w-auto object-contain rounded-xl shadow-xs"
        />
        {onClearPreview && (
          <button
            type="button"
            onClick={onClearPreview}
            aria-label="Remover foto atual"
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-md"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 select-none cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.005]'
            : 'border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          validationError && 'border-destructive/80 bg-destructive/5',
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedMimeTypes.join(',')}
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
          aria-label="Upload de imagem para edição"
        />

        {/* Input específico para captura direta de câmera em mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
          aria-label="Capturar foto pela câmera"
        />

        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary text-primary mb-4 shadow-xs">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h4 className="text-base font-bold text-foreground tracking-tight mb-1">
          Arraste e solte sua foto aqui
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          Suporte a arquivos JPG, PNG ou WebP de até {maxSizeMB} MB. Fotos são salvas de forma segura e privada.
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ImageIcon className="h-4 w-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Escolher Arquivo
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Camera className="h-4 w-4" />}
            onClick={() => cameraInputRef.current?.click()}
          >
            Tirar Foto
          </Button>
        </div>
      </div>

      {validationError && (
        <p
          role="alert"
          className="text-xs text-destructive flex items-center gap-1.5 font-medium px-1"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{validationError}</span>
        </p>
      )}
    </div>
  );
};
