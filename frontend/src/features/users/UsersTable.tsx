import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { User } from '@/types/auth';
import { EditUserDialog } from './EditUserDialog';
import { ROLE_LABELS } from './RoleSelect';

interface UsersTableProps {
  users: User[];
  currentUserId: string | undefined;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  return (
    <Table aria-label="Usuários">
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Cadastro</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="max-w-56 truncate font-medium">{user.name}</TableCell>
            <TableCell className="max-w-64 truncate">{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'outline'}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
            <TableCell className="text-right">
              <EditUserDialog user={user} isOwnAccount={user.id === currentUserId} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
