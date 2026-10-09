import { useParams } from 'react-router';
import { isApiError } from '@/api/http-client';
import { ErrorState, LoadingState } from '@/components/DataStates';
import { useRequestDetails } from '@/hooks/useRequests';
import {
  AdminFeedback,
  BackLink,
  DescriptionAndAttachments,
  RequestHeader,
  RequestNotFound,
} from './RequestOverview';

const NOT_FOUND_STATUS = 404;

// UI-08 (read-only for the author)
export function RequestDetailPage() {
  const { requestId = '' } = useParams();
  const { data, isPending, isError, error, refetch } = useRequestDetails(requestId);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink to="/" label="Voltar ao painel" />
      {isPending && <LoadingState className="h-64" />}
      {isError && isApiError(error, NOT_FOUND_STATUS) && (
        <RequestNotFound hint="Ela não existe ou não pertence à sua conta." />
      )}
      {isError && !isApiError(error, NOT_FOUND_STATUS) && (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      )}
      {data && (
        <div className="space-y-6">
          <RequestHeader request={data} />
          <DescriptionAndAttachments request={data} />
          <AdminFeedback request={data} />
        </div>
      )}
    </div>
  );
}
