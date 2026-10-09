import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/hooks/useAuth';
import type { User } from '@/types/auth';

const INITIALS_COUNT = 2;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, INITIALS_COUNT)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function UserMenu({ user }: { user: User }) {
  const logout = useLogout();
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      await logout.mutateAsync();
      void navigate('/login', { replace: true });
    } catch {
      toast.error('Não foi possível sair. Tente novamente.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2"
          aria-label={`Menu do usuário: ${user.name}`}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
