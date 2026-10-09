import { Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthGuard, RoleGuard } from '@/features/auth/guards';
import { ROLES } from '@/types/auth';

// Placeholder pages; real screens arrive in T-17..T-21.
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
            <Route path="/" element={<PlaceholderPage title="Meu painel" />} />
            <Route
              path="/solicitacoes/nova"
              element={<PlaceholderPage title="Nova solicitação" />}
            />
          </Route>
          <Route element={<RoleGuard allowedRoles={[ROLES.Admin]} />}>
            <Route path="/admin" element={<PlaceholderPage title="Painel administrativo" />} />
            <Route path="/admin/categorias" element={<PlaceholderPage title="Categorias" />} />
            <Route path="/admin/usuarios" element={<PlaceholderPage title="Usuários" />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
    </Routes>
  );
}
