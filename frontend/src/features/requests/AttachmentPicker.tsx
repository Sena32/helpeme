import { ImagePlus, X } from 'lucide-react';
import { useId, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatFileSize } from '@/lib/format';
import { ACCEPTED_IMAGE_TYPES, MAX_ATTACHMENT_MB, MAX_ATTACHMENTS } from '@/schemas/request';
import type { SelectedAttachment } from './useAttachmentSelection';

interface AttachmentPickerProps {
  attachments: SelectedAttachment[];
  errors: string[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
}

export function AttachmentPicker({ attachments, errors, onAdd, onRemove }: AttachmentPickerProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const isFull = attachments.length >= MAX_ATTACHMENTS;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAdd(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId}>Anexos (opcional)</Label>
      <label
        htmlFor={inputId}
        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring"
      >
        <ImagePlus aria-hidden="true" className="size-6" />
        <span>Clique para escolher imagens</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          aria-describedby={hintId}
          disabled={isFull}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
      <p id={hintId} className="text-xs text-muted-foreground">
        JPG ou PNG, até {MAX_ATTACHMENT_MB} MB cada ·{' '}
        <span>
          {attachments.length} de {MAX_ATTACHMENTS} anexos
        </span>
      </p>
      {errors.length > 0 && (
        <ul
          role="alert"
          aria-label="Problemas com os anexos"
          className="space-y-1 text-xs text-destructive"
        >
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {attachments.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments.map(({ key, file, previewUrl }) => (
            <li key={key} className="relative overflow-hidden rounded-lg border">
              <img
                src={previewUrl}
                alt={`Pré-visualização de ${file.name}`}
                className="aspect-video w-full object-cover"
              />
              <p className="truncate p-2 text-xs text-muted-foreground">
                {file.name} · {formatFileSize(file.size)}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1 right-1 size-10"
                aria-label={`Remover ${file.name}`}
                onClick={() => onRemove(key)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
