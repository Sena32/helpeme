import { Navigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useAuth';
import { homePathFor } from './home-path';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

function requestedPath(state: unknown): string | undefined {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') ? from : undefined;
}

// UI-01
export function AuthPage() {
  const { user, isLoading } = useCurrentUser();
  const location = useLocation();

  // Login/sign-up store the session; this single redirect then honours the page the user asked for.
  if (user)
    return <Navigate to={requestedPath(location.state) ?? homePathFor(user.role)} replace />;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pb-12 sm:items-center">
        <Card className="w-full max-w-md rounded-xl">
          <CardHeader className="items-center gap-3 text-center">
            <Logo className="justify-center" />
            <h1 className="text-xl font-semibold">Portal de solicitações de TI</h1>
            <CardDescription>
              Entre com sua conta ou cadastre-se para abrir solicitações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton role="status" aria-label="Verificando sessão" className="h-64 w-full" />
            ) : (
              <Tabs defaultValue="login">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm onRegistered={() => toast.success('Conta criada com sucesso.')} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
