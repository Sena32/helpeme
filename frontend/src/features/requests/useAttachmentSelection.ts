import { useEffect, useRef, useState } from 'react';
import { MAX_ATTACHMENTS, validateAttachment } from '@/schemas/request';

export interface SelectedAttachment {
  key: string;
  file: File;
  previewUrl: string;
}

// Owns the selected files, their validation messages and the object URLs used for previews.
export function useAttachmentSelection() {
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function createPreview(file: File): SelectedAttachment {
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.add(previewUrl);
    return { key: `${file.name}-${crypto.randomUUID()}`, file, previewUrl };
  }

  async function add(files: File[]): Promise<void> {
    const accepted: SelectedAttachment[] = [];
    const messages: string[] = [];
    for (const file of files) {
      const error = await validateAttachment(file);
      if (error) messages.push(error);
      else if (attachments.length + accepted.length >= MAX_ATTACHMENTS) {
        messages.push(`${file.name}: limite de ${MAX_ATTACHMENTS} anexos por solicitação.`);
      } else accepted.push(createPreview(file));
    }
    setErrors(messages);
    setAttachments((current) => [...current, ...accepted]);
  }

  function remove(key: string): void {
    const removed = attachments.find((attachment) => attachment.key === key);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      previewUrls.current.delete(removed.previewUrl);
    }
    setAttachments((current) => current.filter((attachment) => attachment.key !== key));
  }

  return { attachments, errors, add, remove };
}
