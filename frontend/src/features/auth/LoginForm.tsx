import { zodResolver } from '@hookform/resolvers/zod';
import { LIVE_VALIDATION } from '@/lib/forms';
import { useForm } from 'react-hook-form';
import { FormError } from '@/components/forms/FormError';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';

export function LoginForm() {
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    ...LIVE_VALIDATION,
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = formState;

  const submit = handleSubmit((values) => login.mutateAsync(values));

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event).catch(() => undefined)}
      className="space-y-4"
    >
      <FormError error={login.error} />
      <FormField
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" className="h-10 w-full" disabled={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
