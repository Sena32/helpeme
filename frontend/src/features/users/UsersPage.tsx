import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { NewUserDialog } from './NewUserDialog';

// UI-05: the API offers creation only (POST /users), so there is no user listing.
export function UsersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Usuários</h1>
        <NewUserDialog />
      </div>
      <Card className="rounded-xl">
        <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Administradores podem criar novas contas, inclusive outros administradores. O cadastro
            público na tela de login cria apenas usuários comuns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
