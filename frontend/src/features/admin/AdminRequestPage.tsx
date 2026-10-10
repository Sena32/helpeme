import { Lock } from 'lucide-react';
import { useParams } from 'react-router';
import { isApiError } from '@/api/http-client';
import { ErrorState, LoadingState } from '@/components/DataStates';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRequestDetails } from '@/hooks/useRequests';
import {
  AdminFeedback,
  BackLink,
  DescriptionAndAttachments,
  RequestHeader,
  RequestNotFound,
  RequestSection,
} from '@/features/requests/RequestOverview';
import type { RequestDetails } from '@/types/requests';
import { FinalizeForm } from './FinalizeForm';
import { HandlingForm } from './HandlingForm';

const NOT_FOUND_STATUS = 404;

function Handling({ request }: { request: RequestDetails }) {
  if (request.status === 'RESOLVED') {
    return (
      <>
        <Alert>
          <Lock aria-hidden="true" />
          <AlertDescription>
            Esta solicitação foi finalizada e não pode mais ser alterada.
          </AlertDescription>
        </Alert>
        <AdminFeedback request={request} />
      </>
    );
  }
  return (
    <>
      <RequestSection title="Tratamento">
        <HandlingForm request={request} />
        {request.status === 'OPEN' && (
          // RN-07: only requests in progress can be resolved.
          <p className="text-muted-foreground">
            Para finalizar, mude o status para "Em resolução" e salve.
          </p>
        )}
      </RequestSection>
    </>
  );
}

// UI-03
export function AdminRequestPage() {
  const { requestId = '' } = useParams();
  const { data, isPending, isError, error, refetch } = useRequestDetails(requestId);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BackLink to="/admin" label="Voltar ao painel" />
      {isPending && <LoadingState className="h-64" />}
      {isError && isApiError(error, NOT_FOUND_STATUS) && (
        <RequestNotFound hint="Ela pode ter sido removida ou o link está incorreto." />
      )}
      {isError && !isApiError(error, NOT_FOUND_STATUS) && (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      )}
      {data && (
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <RequestHeader request={data} showRequester />
            {data.status === 'IN_PROGRESS' && <FinalizeForm requestId={data.id} />}
          </header>
          <Handling request={data} />
          <DescriptionAndAttachments request={data} />
        </div>
      )}
    </div>
  );
}
