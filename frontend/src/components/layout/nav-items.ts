import { FilePlus2, FolderKanban, LayoutDashboard, Users, type LucideIcon } from 'lucide-react';
import { ROLES, type Role } from '@/types/auth';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// Menus are filtered by role for convenience only; the API enforces access (RF-13).
export const NAV_ITEMS_BY_ROLE: Record<Role, readonly NavItem[]> = {
  [ROLES.User]: [
    { label: 'Meu painel', path: '/', icon: LayoutDashboard },
    { label: 'Nova solicitação', path: '/solicitacoes/nova', icon: FilePlus2 },
  ],
  [ROLES.Admin]: [
    { label: 'Painel', path: '/admin', icon: LayoutDashboard },
    { label: 'Categorias', path: '/admin/categorias', icon: FolderKanban },
    { label: 'Usuários', path: '/admin/usuarios', icon: Users },
  ],
};
