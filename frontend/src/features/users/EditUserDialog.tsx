import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormError } from '@/components/forms/FormError';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUpdateUser } from '@/hooks/useUsers';
import { LIVE_VALIDATION } from '@/lib/forms';
import { editUserSchema, type EditUserFormValues } from '@/schemas/admin-forms';
import type { User } from '@/types/auth';
import { RoleSelect } from './RoleSelect';

interface EditUserDialogProps {
  user: User;
  isOwnAccount: boolean;
}

const toFormValues = ({ name, email, role }: User): EditUserFormValues => ({ name, email, role });

// RF-17 / RN-14: the own profile stays locked so an admin cannot lose access by mistake.
export function EditUserDialog({ user, isOwnAccount }: EditUserDialogProps) {
  const ids = { role: useId(), roleHint: useId() };
  const [isOpen, setOpen] = useState(false);
  const updateUser = useUpdateUser(user.id);
  const { register, handleSubmit, formState, reset, control } = useForm<EditUserFormValues>({
    ...LIVE_VALIDATION,
    resolver: zodResolver(editUserSchema),
    defaultValues: toFormValues(user),
  });
  const { errors } = formState;

  const changeOpen = (open: boolean) => {
    setOpen(open);
    if (open) reset(toFormValues(user));
    if (!open) updateUser.reset();
  };
  const submit = handleSubmit(async (values) => {
    const updated = await updateUser.mutateAsync(values);
    toast.success(`Usuário "${updated.name}" atualizado.`);
    changeOpen(false);
  });

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10" aria-label={`Editar ${user.name}`}>
          <Pencil aria-hidden="true" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Altere nome, e-mail ou perfil. A senha não muda.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => void submit(event).catch(() => undefined)}
          className="space-y-4"
        >
          <FormError error={updateUser.error} />
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
          <div className="space-y-2">
            <Label htmlFor={ids.role}>Perfil</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleSelect
                  id={ids.role}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isOwnAccount}
                  describedBy={isOwnAccount ? ids.roleHint : undefined}
                />
              )}
            />
            {isOwnAccount && (
              <p id={ids.roleHint} className="text-xs text-muted-foreground">
                Você não pode alterar o seu próprio perfil.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="h-10" disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
