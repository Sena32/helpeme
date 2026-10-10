import { attachmentUrl } from '@/api/requests';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatFileSize } from '@/lib/format';
import type { Attachment } from '@/types/requests';

function AttachmentPreview({ url, attachment }: { url: string; attachment: Attachment }) {
  const size = formatFileSize(attachment.sizeBytes);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Ampliar ${attachment.originalName} (${size})`}
          className="group block w-full cursor-zoom-in overflow-hidden rounded-lg border text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
        </button>
      </DialogTrigger>
      {/* AC-40: enlarged on the same page; closes via "Fechar", Esc or clicking outside. */}
      <DialogContent showCloseButton={false} className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{attachment.originalName}</DialogTitle>
          <DialogDescription>{size}</DialogDescription>
        </DialogHeader>
        <img
          src={url}
          alt={attachment.originalName}
          className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain"
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="h-10">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <AttachmentPreview
            url={attachmentUrl(requestId, attachment.id)}
            attachment={attachment}
          />
        </li>
      ))}
    </ul>
  );
}
