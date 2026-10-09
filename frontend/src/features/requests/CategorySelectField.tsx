import { useId } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { ErrorState } from '@/components/DataStates';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import type { CreateRequestFormValues } from '@/schemas/request';

interface CategorySelectFieldProps {
  control: Control<CreateRequestFormValues>;
  error?: string;
}

export function CategorySelectField({ control, error }: CategorySelectFieldProps) {
  const triggerId = useId();
  const errorId = `${triggerId}-error`;
  const categories = useCategories();

  return (
    <div className="space-y-2">
      <Label htmlFor={triggerId}>Categoria</Label>
      {categories.isError ? (
        <ErrorState message={categories.error.message} onRetry={() => void categories.refetch()} />
      ) : (
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={categories.isPending}
            >
              <SelectTrigger
                id={triggerId}
                className="h-10 w-full"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onBlur={field.onBlur}
              >
                <SelectValue
                  placeholder={categories.isPending ? 'Carregando categorias…' : 'Selecione'}
                />
              </SelectTrigger>
              <SelectContent>
                {categories.data?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
