import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from '@/schemas/auth';
import { cn } from '@/lib/utils';

export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} aria-label="Requisitos da senha" className="grid gap-1 text-xs sm:grid-cols-2">
      {PASSWORD_RULES.map(({ label, test }) => {
        const isMet = test(password);
        const Icon = isMet ? Check : X;
        return (
          <li
            key={label}
            data-met={isMet}
            className={cn(
              'flex items-center gap-1',
              isMet ? 'text-success' : 'text-muted-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            <span>{label}</span>
            <span className="sr-only">{isMet ? '(atendido)' : '(pendente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
