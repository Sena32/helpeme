import { zodResolver } from '@hookform/resolvers/zod';
import { LIVE_VALIDATION } from '@/lib/forms';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useCreateCategory } from '@/hooks/useCategories';
import { categorySchema, type CategoryFormValues } from '@/schemas/admin-forms';

export function NewCategoryDialog() {
  const [isOpen, setOpen] = useState(false);
  const createCategory = useCreateCategory();
  const { register, handleSubmit, formState, reset } = useForm<CategoryFormValues>({
    ...LIVE_VALIDATION,
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const changeOpen = (open: boolean) => {
    setOpen(open);
    if (!open) {
      reset();
      createCategory.reset();
    }
  };
  const submit = handleSubmit(async ({ name }) => {
    const created = await createCategory.mutateAsync(name);
    toast.success(`Categoria "${created.name}" criada.`);
    changeOpen(false);
  });

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button className="h-10">
          <Plus aria-hidden="true" />
          Nova categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            O nome deve ser único (sem diferenciar maiúsculas) e ter de 2 a 50 caracteres.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => void submit(event).catch(() => undefined)}
          className="space-y-4"
        >
          <FormError error={createCategory.error} />
          <FormField label="Nome" error={formState.errors.name?.message} {...register('name')} />
          <DialogFooter>
            <Button type="submit" className="h-10" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Criando…' : 'Criar categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
