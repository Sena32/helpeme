import { Link, useNavigate } from 'react-router';
import { PriorityBadge, StatusBadge } from '@/components/RequestBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { RequestListItem } from '@/types/requests';

export const requestDetailPath = (requestId: string) => `/solicitacoes/${requestId}`;

export function UserRequestsTable({ items }: { items: RequestListItem[] }) {
  const navigate = useNavigate();

  return (
    <Table aria-label="Minhas solicitações">
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Criada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => void navigate(requestDetailPath(item.id))}
          >
            <TableCell className="font-medium">
              {/* The link keeps the row reachable and announced by keyboard/screen readers. */}
              <Link
                to={requestDetailPath(item.id)}
                className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={(event) => event.stopPropagation()}
              >
                {item.title}
              </Link>
            </TableCell>
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
