import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

// UI-09: unknown routes. Role-based denials redirect to the user's home (AC-29).
export function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <Logo />
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        O endereço acessado não existe ou foi alterado.
      </p>
      <Button asChild className="h-10">
        <Link to="/">
          <ArrowLeft aria-hidden="true" />
          Voltar ao início
        </Link>
      </Button>
    </main>
  );
}
