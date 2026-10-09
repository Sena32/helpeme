import { ChevronDown, ChevronsUp, Equal, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Priority, RequestStatus } from '@/types/requests';

// Semantics from SPEC-06: colour is always paired with text (and an icon for priority).
const STATUS_STYLES: Record<RequestStatus, { label: string; className: string }> = {
  OPEN: { label: 'Aberta', className: 'border-primary/30 bg-primary/10 text-primary' },
  IN_PROGRESS: { label: 'Em resolução', className: 'border-warning/30 bg-warning/10 text-warning' },
  RESOLVED: { label: 'Finalizada', className: 'border-success/30 bg-success/10 text-success' },
};

const PRIORITY_STYLES: Record<Priority, { label: string; icon: LucideIcon; className: string }> = {
  HIGH: {
    label: 'Alta',
    icon: ChevronsUp,
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  MEDIUM: {
    label: 'Média',
    icon: Equal,
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  LOW: {
    label: 'Baixa',
    icon: ChevronDown,
    className: 'border-success/30 bg-success/10 text-success',
  },
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: STATUS_STYLES.OPEN.label,
  IN_PROGRESS: STATUS_STYLES.IN_PROGRESS.label,
  RESOLVED: STATUS_STYLES.RESOLVED.label,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: PRIORITY_STYLES.HIGH.label,
  MEDIUM: PRIORITY_STYLES.MEDIUM.label,
  LOW: PRIORITY_STYLES.LOW.label,
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sem prioridade
      </Badge>
    );
  }
  const { label, icon: Icon, className } = PRIORITY_STYLES[priority];
  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </Badge>
  );
}
