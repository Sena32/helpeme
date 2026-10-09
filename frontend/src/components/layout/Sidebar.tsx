import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NavItem } from './nav-items';
import { NavLinks } from './NavLinks';

interface SidebarProps {
  items: readonly NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ items, collapsed, onToggle }: SidebarProps) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col gap-6 border-r bg-card p-3 transition-[width] md:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <Logo className="[&_img]:size-8 [&>span]:text-xl" />}
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <ToggleIcon aria-hidden="true" />
        </Button>
      </div>
      <NavLinks items={items} label="Menu principal" collapsed={collapsed} />
    </aside>
  );
}
