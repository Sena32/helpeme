import { CheckCircle2, Clock, FilePlus2, Inbox, ListTodo } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyState, ErrorState, LoadingState } from '@/components/DataStates';
import { KpiCard } from '@/components/KpiCard';
import { PaginationControls } from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useRequestList } from '@/hooks/useRequests';
import { UserRequestsTable } from './UserRequestsTable';

const PAGE_SIZE = 10;
const NEW_REQUEST_PATH = '/solicitacoes/nova';

function NewRequestLink({ label }: { label: string }) {
  return (
    <Button asChild className="h-10">
      <Link to={NEW_REQUEST_PATH}>
        <FilePlus2 aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}

function OwnKpis() {
  const { data, isPending, isError, error, refetch } = useDashboardSummary();
  if (isPending) return <LoadingState className="h-28" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  return (
    <section
      aria-label="Resumo das suas solicitações"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <KpiCard label="Total" value={data.total} icon={Inbox} />
      <KpiCard label="Abertas" value={data.byStatus.OPEN} icon={ListTodo} />
      <KpiCard label="Em resolução" value={data.byStatus.IN_PROGRESS} icon={Clock} />
      <KpiCard label="Finalizadas" value={data.byStatus.RESOLVED} icon={CheckCircle2} />
    </section>
  );
}

function OwnRequests() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useRequestList({
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt',
    order: 'desc',
  });

  if (isPending) return <LoadingState className="h-64" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  if (data.total === 0) {
    return (
      <EmptyState
        message="Você ainda não abriu solicitações."
        action={<NewRequestLink label="Abrir solicitação" />}
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <UserRequestsTable items={data.items} />
      </div>
      <PaginationControls
        page={data.page}
        limit={data.limit}
        total={data.total}
        onPageChange={setPage}
      />
    </div>
  );
}

// UI-06
export function UserDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Meu painel</h1>
        <NewRequestLink label="Nova solicitação" />
      </div>
      <OwnKpis />
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>
            <h2 className="text-xl font-semibold">Minhas solicitações</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OwnRequests />
        </CardContent>
      </Card>
    </div>
  );
}
