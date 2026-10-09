import { useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useAuth';
import { NAV_ITEMS_BY_ROLE } from './nav-items';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const { user, isLoading } = useCurrentUser();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) return <Skeleton role="status" aria-label="Carregando" className="m-4 h-32" />;
  if (!user) return <Navigate to="/login" replace />;
  const items = NAV_ITEMS_BY_ROLE[user.role];

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <Sidebar
        items={items}
        collapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} items={items} />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
