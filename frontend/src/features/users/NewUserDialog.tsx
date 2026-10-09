import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FormError } from '@/components/forms/FormError';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PasswordChecklist } from '@/features/auth/PasswordChecklist';
import { useCreateUser } from '@/hooks/useUsers';
import { createUserSchema, type CreateUserFormValues } from '@/schemas/admin-forms';
import { ROLES, type Role } from '@/types/auth';

const ROLE_LABELS: Record<Role, string> = { USER: 'Usuário', ADMIN: 'Administrador' };
const EMPTY_FORM: CreateUserFormValues = { name: '', email: '', password: '', role: ROLES.User };

export function NewUserDialog() {
  const ids = { role: useId(), checklist: useId() };
  const [isOpen, setOpen] = useState(false);
  const createUser = useCreateUser();
  const { register, handleSubmit, formState, reset, control } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY_FORM,
  });
  const password = useWatch({ control, name: 'password' });
  const { errors } = formState;

  const changeOpen = (open: boolean) => {
    setOpen(open);
    if (!open) {
      reset(EMPTY_FORM);
      createUser.reset();
    }
  };
  const submit = handleSubmit(async (values) => {
    const created = await createUser.mutateAsync(values);
    toast.success(`${created.name} foi criado como ${ROLE_LABELS[created.role]}.`);
    changeOpen(false);
  });

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button className="h-10">
          <UserPlus aria-hidden="true" />
          Novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>Crie contas de usuário ou de administrador.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => void submit(event).catch(() => undefined)}
          className="space-y-4"
        >
          <FormError error={createUser.error} />
          <FormField
            label="Nome"
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <FormField
            label="E-mail"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />
          <FormField
            label="Senha"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            describedBy={ids.checklist}
            {...register('password')}
          />
          <PasswordChecklist id={ids.checklist} password={password} />
          <div className="space-y-2">
            <Label htmlFor={ids.role}>Perfil</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={ids.role} className="h-10 w-full">
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
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="h-10" disabled={createUser.isPending}>
              {createUser.isPending ? 'Criando…' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
