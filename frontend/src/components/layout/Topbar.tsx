import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { User } from '@/types/auth';
import type { NavItem } from './nav-items';
import { NavLinks } from './NavLinks';
import { UserMenu } from './UserMenu';

export function Topbar({ user, items }: { user: User; items: readonly NavItem[] }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="flex h-16 items-center gap-2 border-b bg-card px-4">
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-10 md:hidden" aria-label="Abrir menu">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4">
          <SheetHeader className="px-0">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">Navegação principal do HelpeMe</SheetDescription>
          </SheetHeader>
          <NavLinks items={items} label="Navegação" onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
      <Logo compact className="md:hidden [&_img]:size-8" />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
