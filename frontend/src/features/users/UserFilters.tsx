import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLES, type Role, type UserListQuery } from '@/types/auth';
import { ROLE_LABELS } from './RoleSelect';

const ALL = 'ALL';

interface UserFiltersProps {
  query: UserListQuery;
  onChange: (changes: Partial<UserListQuery>) => void;
}

const toRole = (value: string): Role | undefined =>
  Object.values(ROLES).find((role) => role === value);

export function UserFilters({ query, onChange }: UserFiltersProps) {
  const roleId = useId();
  const [search, setSearch] = useState(query.search ?? '');

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    onChange({ search: search.trim() || undefined });
  };

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[2fr_1fr]">
      <form role="search" onSubmit={submitSearch} className="flex gap-2">
        <Input
          type="search"
          aria-label="Buscar por nome ou e-mail"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10"
        />
        <Button type="submit" variant="outline" size="icon" className="size-10" aria-label="Buscar">
          <Search aria-hidden="true" />
        </Button>
      </form>
      <div className="space-y-1">
        <Label htmlFor={roleId} className="text-xs text-muted-foreground">
          Perfil
        </Label>
        <Select
          value={query.role ?? ALL}
          onValueChange={(next) => onChange({ role: toRole(next) })}
        >
          <SelectTrigger id={roleId} className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {Object.values(ROLES).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
