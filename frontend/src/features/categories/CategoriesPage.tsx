import { FolderKanban } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/DataStates';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { NewCategoryDialog } from './NewCategoryDialog';

function CategoryList() {
  const { data, isPending, isError, error, refetch } = useCategories();
  if (isPending) return <LoadingState className="h-40" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  if (data.length === 0) return <EmptyState message="Nenhuma categoria cadastrada." />;

  return (
    <ul aria-label="Categorias ativas" className="divide-y">
      {data.map((category) => (
        <li key={category.id} className="flex items-center gap-3 py-3 text-sm">
          <FolderKanban aria-hidden="true" className="size-4 text-muted-foreground" />
          {category.name}
        </li>
      ))}
    </ul>
  );
}

// UI-04
export function CategoriesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Categorias</h1>
        <NewCategoryDialog />
      </div>
      <Card className="rounded-xl">
        <CardContent>
          <CategoryList />
        </CardContent>
      </Card>
    </div>
  );
}
