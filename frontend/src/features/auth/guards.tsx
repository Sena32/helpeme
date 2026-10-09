import { Navigate, Outlet, useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useAuth';
import type { Role } from '@/types/auth';
import { homePathFor } from './home-path';

export const LOGIN_PATH = '/login';

function SessionCheck() {
  return (
    <div role="status" aria-label="Verificando sessão" className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// AC-28: without a session, go to login and remember where the user wanted to go.
export function AuthGuard() {
  const { user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) return <SessionCheck />;
  if (!user) {
    return (
      <Navigate to={LOGIN_PATH} replace state={{ from: location.pathname + location.search }} />
    );
  }
  return <Outlet />;
}

// AC-29: UI convenience only; the backend RolesGuard remains the source of truth.
export function RoleGuard({ allowedRoles }: { allowedRoles: readonly Role[] }) {
  const { user } = useCurrentUser();

  if (!user) return <Navigate to={LOGIN_PATH} replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}
