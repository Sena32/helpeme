import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLES, type Role } from '@/types/auth';

export const ROLE_LABELS: Record<Role, string> = { USER: 'Usuário', ADMIN: 'Administrador' };

interface RoleSelectProps {
  id: string;
  value: Role;
  onValueChange: (role: Role) => void;
  disabled?: boolean;
  describedBy?: string;
}

const isRole = (value: string): value is Role => Object.values<string>(ROLES).includes(value);

export function RoleSelect({ id, value, onValueChange, disabled, describedBy }: RoleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => isRole(next) && onValueChange(next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="h-10 w-full" aria-describedby={describedBy}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(ROLES).map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
