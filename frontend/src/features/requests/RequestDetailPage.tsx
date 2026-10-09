import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { isApiError } from '@/api/http-client';
import { ErrorState, LoadingState } from '@/components/DataStates';
import { PriorityBadge, StatusBadge } from '@/components/RequestBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestDetails } from '@/hooks/useRequests';
import { formatDateTime } from '@/lib/format';
import type { RequestDetails } from '@/types/requests';
import { AttachmentGallery } from './AttachmentGallery';

const NOT_FOUND_STATUS = 404;

function BackLink() {
  return (
    <Button asChild variant="ghost" className="h-10 px-2">
      <Link to="/">
        <ArrowLeft aria-hidden="true" />
        Voltar ao painel
      </Link>
    </Button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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

function RequestDetailsView({ request }: { request: RequestDetails }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold break-words">{request.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          <span>{request.category.name}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDateTime(request.createdAt)}</span>
        </div>
      </div>
      <Section title="Descrição">
        <p className="whitespace-pre-wrap">{request.description}</p>
      </Section>
      <Section title="Observação do administrador">
        <p className={request.adminNote ? 'whitespace-pre-wrap' : 'text-muted-foreground'}>
          {request.adminNote ?? 'O administrador ainda não adicionou observações.'}
        </p>
      </Section>
      {request.resolution && (
        <Section title="Resolução">
          <p className="whitespace-pre-wrap">{request.resolution}</p>
          {request.resolvedAt && (
            <p className="text-xs text-muted-foreground">
              Finalizada em {formatDateTime(request.resolvedAt)}
            </p>
          )}
        </Section>
      )}
      <Section title="Anexos">
        <AttachmentGallery requestId={request.id} attachments={request.attachments} />
      </Section>
    </div>
  );
}

// UI-08 (read-only for the author)
export function RequestDetailPage() {
  const { requestId = '' } = useParams();
  const { data, isPending, isError, error, refetch } = useRequestDetails(requestId);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink />
      {isPending && <LoadingState className="h-64" />}
      {isError && isApiError(error, NOT_FOUND_STATUS) && (
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Solicitação não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Ela não existe ou não pertence à sua conta.
          </p>
        </div>
      )}
      {isError && !isApiError(error, NOT_FOUND_STATUS) && (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      )}
      {data && <RequestDetailsView request={data} />}
    </div>
  );
}
