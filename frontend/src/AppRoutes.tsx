import { Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminRequestPage } from '@/features/admin/AdminRequestPage';
import { AuthPage } from '@/features/auth/AuthPage';
import { CategoriesPage } from '@/features/categories/CategoriesPage';
import { NotFoundPage } from '@/features/errors/NotFoundPage';
import { AuthGuard, RoleGuard } from '@/features/auth/guards';
import { NewRequestPage } from '@/features/requests/NewRequestPage';
import { RequestDetailPage } from '@/features/requests/RequestDetailPage';
import { UsersPage } from '@/features/users/UsersPage';
import { UserDashboardPage } from '@/features/requests/UserDashboardPage';
import { ROLES } from '@/types/auth';

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
            <Route path="/admin/solicitacoes/:requestId" element={<AdminRequestPage />} />
            <Route path="/admin/categorias" element={<CategoriesPage />} />
            <Route path="/admin/usuarios" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
