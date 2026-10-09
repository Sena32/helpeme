import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PriorityBadge, StatusBadge } from '@/components/RequestBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import type { RequestDetails } from '@/types/requests';
import { AttachmentGallery } from './AttachmentGallery';

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="ghost" className="h-10 px-2">
      <Link to={to}>
        <ArrowLeft aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}

export function RequestSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-medium">{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

export function RequestNotFound({ hint }: { hint: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">Solicitação não encontrada</h1>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export function RequestHeader({
  request,
  showRequester = false,
}: {
  request: RequestDetails;
  showRequester?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold break-words">{request.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusBadge status={request.status} />
        <PriorityBadge priority={request.priority} />
        <span>{request.category.name}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDateTime(request.createdAt)}</span>
      </div>
      {showRequester && (
        <p className="text-sm text-muted-foreground">Solicitado por {request.createdBy.name}</p>
      )}
    </div>
  );
}

export function DescriptionAndAttachments({ request }: { request: RequestDetails }) {
  return (
    <>
      <RequestSection title="Descrição">
        <p className="whitespace-pre-wrap">{request.description}</p>
      </RequestSection>
      <RequestSection title="Anexos">
        <AttachmentGallery requestId={request.id} attachments={request.attachments} />
      </RequestSection>
    </>
  );
}

export function AdminFeedback({ request }: { request: RequestDetails }) {
  return (
    <>
      <RequestSection title="Observação do administrador">
        <p className={request.adminNote ? 'whitespace-pre-wrap' : 'text-muted-foreground'}>
          {request.adminNote ?? 'O administrador ainda não adicionou observações.'}
        </p>
      </RequestSection>
      {request.resolution && (
        <RequestSection title="Resolução">
          <p className="whitespace-pre-wrap">{request.resolution}</p>
          {request.resolvedAt && (
            <p className="text-xs text-muted-foreground">
              Finalizada em {formatDateTime(request.resolvedAt)}
            </p>
          )}
        </RequestSection>
      )}
    </>
  );
}
