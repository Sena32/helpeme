import { attachmentUrl } from '@/api/requests';
import { formatFileSize } from '@/lib/format';
import type { Attachment } from '@/types/requests';

export function AttachmentGallery({
  requestId,
  attachments,
}: {
  requestId: string;
  attachments: Attachment[];
}) {
  if (attachments.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhum anexo enviado.</p>;

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {attachments.map((attachment) => {
        const url = attachmentUrl(requestId, attachment.id);
        const size = formatFileSize(attachment.sizeBytes);
        return (
          <li key={attachment.id}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${attachment.originalName} (${size}) em nova aba`}
              className="group block overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <img
                src={url}
                alt={attachment.originalName}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
              <span className="block truncate p-2 text-xs text-muted-foreground">
                {attachment.originalName} · {size}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
