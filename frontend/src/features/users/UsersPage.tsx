import { useSearchParams } from 'react-router';
import { EmptyState, ErrorState, LoadingState } from '@/components/DataStates';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useAuth';
import { useUserList } from '@/hooks/useUsers';
import type { UserListQuery } from '@/types/auth';
import { NewUserDialog } from './NewUserDialog';
import { parseUserListQuery, toUserSearchParams } from './user-list-query';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';

function UserList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseUserListQuery(searchParams);
  const { user: currentUser } = useCurrentUser();
  const { data, isPending, isError, error, refetch } = useUserList(query);

  const update = (changes: Partial<UserListQuery>) =>
    setSearchParams(toUserSearchParams({ ...query, page: 1, ...changes }));

  return (
    <div className="space-y-4">
      <UserFilters query={query} onChange={update} />
      {isPending && <LoadingState className="h-64" />}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {data && data.total === 0 && <EmptyState message="Nenhum usuário encontrado." />}
      {data && data.total > 0 && (
        <>
          <div className="overflow-x-auto">
            <UsersTable users={data.items} currentUserId={currentUser?.id} />
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

// UI-05
export function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Usuários</h1>
        <NewUserDialog />
      </div>
      <Card className="rounded-xl">
        <CardContent>
          <UserList />
        </CardContent>
      </Card>
    </div>
  );
}
