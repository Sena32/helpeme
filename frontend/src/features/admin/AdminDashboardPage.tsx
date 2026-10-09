import { useSearchParams } from 'react-router';
import { EmptyState, ErrorState, LoadingState } from '@/components/DataStates';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestList } from '@/hooks/useRequests';
import type { RequestListQuery } from '@/types/requests';
import { DEFAULT_ADMIN_QUERY, parseAdminListQuery, toAdminSearchParams } from './admin-list-query';
import { AdminOverview } from './AdminOverview';
import { AdminRequestsTable } from './AdminRequestsTable';
import { RequestFilters } from './RequestFilters';

type SortField = NonNullable<RequestListQuery['sortBy']>;
const BACKEND_DEFAULT_SORT = { sortBy: 'priority', order: 'desc' } as const;

function AdminRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseAdminListQuery(searchParams);
  const { data, isPending, isError, error, refetch } = useRequestList(query);
  const sortBy = query.sortBy ?? BACKEND_DEFAULT_SORT.sortBy;
  const order = query.order ?? BACKEND_DEFAULT_SORT.order;

  const update = (changes: Partial<RequestListQuery>) =>
    setSearchParams(toAdminSearchParams({ ...query, page: 1, ...changes }));
  const sort = (field: SortField) =>
    update({ sortBy: field, order: field === sortBy && order === 'desc' ? 'asc' : 'desc' });

  return (
    <div className="space-y-4">
      <RequestFilters
        query={query}
        onChange={update}
        onClear={() => setSearchParams(toAdminSearchParams(DEFAULT_ADMIN_QUERY))}
      />
      {isPending && <LoadingState className="h-64" />}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {data && data.total === 0 && <EmptyState message="Nenhuma solicitação encontrada." />}
      {data && data.total > 0 && (
        <>
          <div className="overflow-x-auto">
            <AdminRequestsTable items={data.items} sortBy={sortBy} order={order} onSort={sort} />
          </div>
          <PaginationControls
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={(page) => update({ page })}
          />
        </>
      )}
    </div>
  );
}

// UI-02
export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Painel administrativo</h1>
      <AdminOverview />
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>
            <h2 className="text-xl font-semibold">Solicitações</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminRequests />
        </CardContent>
      </Card>
    </div>
  );
}
