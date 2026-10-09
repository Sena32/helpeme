import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FormError } from '@/components/forms/FormError';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import { useRegister } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { PasswordChecklist } from './PasswordChecklist';

export function RegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const registerAccount = useRegister();
  const checklistId = useId();
  const { register, handleSubmit, formState, control } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const { errors } = formState;
  const password = useWatch({ control, name: 'password' });

  const submit = handleSubmit(async (values) => {
    await registerAccount.mutateAsync(values);
    onRegistered();
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event).catch(() => undefined)}
      className="space-y-4"
    >
      <FormError error={registerAccount.error} />
      <FormField
        label="Nome"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        describedBy={checklistId}
        {...register('password')}
      />
      <PasswordChecklist id={checklistId} password={password} />
      <Button type="submit" className="h-10 w-full" disabled={registerAccount.isPending}>
        {registerAccount.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  );
}
