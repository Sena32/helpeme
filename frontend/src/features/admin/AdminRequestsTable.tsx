import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { PriorityBadge, StatusBadge } from '@/components/RequestBadges';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { RequestListItem, RequestListQuery } from '@/types/requests';

type SortField = NonNullable<RequestListQuery['sortBy']>;
type SortOrder = NonNullable<RequestListQuery['order']>;

export const adminRequestPath = (requestId: string) => `/admin/solicitacoes/${requestId}`;

interface SortableHeaderProps {
  field: SortField;
  label: string;
  buttonLabel: string;
  activeField: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

function SortableHeader({
  field,
  label,
  buttonLabel,
  activeField,
  order,
  onSort,
}: SortableHeaderProps) {
  const isActive = field === activeField;
  const Icon = !isActive ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <Button
        variant="ghost"
        className="h-10 px-2"
        aria-label={buttonLabel}
        onClick={() => onSort(field)}
      >
        {label}
        <Icon aria-hidden="true" className="size-3.5" />
      </Button>
    </TableHead>
  );
}

interface AdminRequestsTableProps {
  items: RequestListItem[];
  sortBy: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

export function AdminRequestsTable({ items, sortBy, order, onSort }: AdminRequestsTableProps) {
  const navigate = useNavigate();
  const sortProps = { activeField: sortBy, order, onSort };

  return (
    <Table aria-label="Solicitações">
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Solicitante</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Status</TableHead>
          <SortableHeader
            field="priority"
            label="Prioridade"
            buttonLabel="Ordenar por prioridade"
            {...sortProps}
          />
          <SortableHeader
            field="createdAt"
            label="Criada em"
            buttonLabel="Ordenar por data de criação"
            {...sortProps}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => void navigate(adminRequestPath(item.id))}
          >
            <TableCell className="max-w-64 truncate font-medium">
              <Link
                to={adminRequestPath(item.id)}
                onClick={(event) => event.stopPropagation()}
                className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {item.title}
              </Link>
            </TableCell>
            <TableCell>{item.createdBy?.name}</TableCell>
            <TableCell>{item.categoryName}</TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell>
              <PriorityBadge priority={item.priority} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
