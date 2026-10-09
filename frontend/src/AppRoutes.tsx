import { Route, Routes } from 'react-router';
import { AuthGuard, RoleGuard } from '@/features/auth/guards';
import { ROLES } from '@/types/auth';

// Placeholder pages; real screens arrive in T-16..T-21.
function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="p-4">
      <h1 className="text-3xl font-semibold">{title}</h1>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PlaceholderPage title="Entrar" />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<PlaceholderPage title="Minhas solicitações" />} />
        <Route element={<RoleGuard allowedRoles={[ROLES.Admin]} />}>
          <Route path="/admin" element={<PlaceholderPage title="Painel administrativo" />} />
        </Route>
      </Route>
      <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
    </Routes>
  );
}
