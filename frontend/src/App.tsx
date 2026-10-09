import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function App() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="p-4">
        <h1 className="text-3xl font-semibold">Portal de solicitações de TI</h1>
      </main>
    </div>
  );
}
