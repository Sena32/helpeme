import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import type { NavItem } from './nav-items';

interface NavLinksProps {
  items: readonly NavItem[];
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavLinks({ items, label, collapsed = false, onNavigate }: NavLinksProps) {
  return (
    <nav aria-label={label}>
      <ul className="space-y-1">
        {items.map(({ label: itemLabel, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end
              onClick={onNavigate}
              title={collapsed ? itemLabel : undefined}
              className={({ isActive }) =>
                cn(
                  'flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive && 'bg-primary/10 text-primary',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className={cn(collapsed && 'sr-only')}>{itemLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
