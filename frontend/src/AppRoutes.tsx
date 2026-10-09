import { Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthGuard, RoleGuard } from '@/features/auth/guards';
import { NewRequestPage } from '@/features/requests/NewRequestPage';
import { RequestDetailPage } from '@/features/requests/RequestDetailPage';
import { UserDashboardPage } from '@/features/requests/UserDashboardPage';
import { ROLES } from '@/types/auth';

// Placeholder pages; real screens arrive in T-20..T-21.
function PlaceholderPage({ title }: { title: string }) {
  return <h1 className="text-3xl font-semibold">{title}</h1>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route element={<RoleGuard allowedRoles={[ROLES.User]} />}>
            <Route path="/" element={<UserDashboardPage />} />
            <Route path="/solicitacoes/nova" element={<NewRequestPage />} />
            <Route path="/solicitacoes/:requestId" element={<RequestDetailPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[ROLES.Admin]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/categorias" element={<PlaceholderPage title="Categorias" />} />
            <Route path="/admin/usuarios" element={<PlaceholderPage title="Usuários" />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
    </Routes>
  );
}
