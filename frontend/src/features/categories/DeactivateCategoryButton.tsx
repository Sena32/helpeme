import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeactivateCategory } from '@/hooks/useCategories';
import type { Category } from '@/types/categories';

// RF-15 / RN-12: confirmation explains that existing requests are kept.
export function DeactivateCategoryButton({ category }: { category: Category }) {
  const deactivate = useDeactivateCategory();

  const confirm = async () => {
    try {
      await deactivate.mutateAsync(category.id);
      toast.success(`Categoria "${category.name}" desativada.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível desativar a categoria.',
      );
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10"
          aria-label={`Desativar ${category.name}`}
          disabled={deactivate.isPending}
        >
          Desativar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar a categoria "{category.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Ela deixa de aparecer para novas solicitações. As solicitações existentes continuam com
            esta categoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="h-10" onClick={() => void confirm()}>
            Desativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
