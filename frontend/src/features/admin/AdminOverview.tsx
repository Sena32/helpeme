import { AlertTriangle, CheckCircle2, Clock, Inbox, ListTodo } from 'lucide-react';
import { BarList, type BarListItem } from '@/components/BarList';
import { ErrorState, LoadingState } from '@/components/DataStates';
import { KpiCard } from '@/components/KpiCard';
import { STATUS_LABELS } from '@/components/RequestBadges';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardSummary } from '@/hooks/useDashboard';
import type { DashboardSummary } from '@/types/dashboard';
import { REQUEST_STATUSES } from '@/types/requests';

// Status bars reuse the reserved semantic tokens of SPEC-06, always next to the status text.
const STATUS_BAR_CLASSES = {
  OPEN: 'bg-primary',
  IN_PROGRESS: 'bg-warning',
  RESOLVED: 'bg-success',
} as const;

function statusBars({ byStatus }: DashboardSummary): BarListItem[] {
  return Object.values(REQUEST_STATUSES).map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    value: byStatus[status],
    barClassName: STATUS_BAR_CLASSES[status],
  }));
}

function categoryBars({ byCategory }: DashboardSummary): BarListItem[] {
  return byCategory.map(({ categoryId, name, count }) => ({
    key: categoryId,
    label: name,
    value: count,
  }));
}

export function AdminOverview() {
  const { data, isPending, isError, error, refetch } = useDashboardSummary();
  if (isPending) return <LoadingState className="h-40" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores gerais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <KpiCard label="Total" value={data.total} icon={Inbox} />
        <KpiCard label="Abertas" value={data.byStatus.OPEN} icon={ListTodo} />
        <KpiCard label="Em resolução" value={data.byStatus.IN_PROGRESS} icon={Clock} />
        <KpiCard label="Finalizadas" value={data.byStatus.RESOLVED} icon={CheckCircle2} />
        <KpiCard label="Alta prioridade" value={data.byPriority.HIGH} icon={AlertTriangle} />
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardContent>
            <BarList title="Solicitações por status" items={statusBars(data)} />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent>
            <BarList title="Solicitações por categoria" items={categoryBars(data)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
