import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/components/RequestBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import {
  PRIORITIES,
  REQUEST_STATUSES,
  UNSET_PRIORITY,
  type RequestListQuery,
} from '@/types/requests';

const ALL = 'ALL';
type FilterName = 'status' | 'categoryId' | 'priority';

interface RequestFiltersProps {
  query: RequestListQuery;
  onChange: (changes: Partial<RequestListQuery>) => void;
  onClear: () => void;
}

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string | undefined) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onValueChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function RequestFilters({ query, onChange, onClear }: RequestFiltersProps) {
  const categories = useCategories();
  const [search, setSearch] = useState(query.search ?? '');
  const hasFilters = Boolean(query.status || query.categoryId || query.priority || query.search);

  const setFilter = (name: FilterName) => (value: string | undefined) =>
    onChange({ [name]: value });
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    onChange({ search: search.trim() || undefined });
  };
  const clear = () => {
    setSearch('');
    onClear();
  };

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <form role="search" onSubmit={submitSearch} className="flex gap-2">
        <Input
          type="search"
          aria-label="Buscar por título"
          placeholder="Buscar por título"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10"
        />
        <Button type="submit" variant="outline" size="icon" className="size-10" aria-label="Buscar">
          <Search aria-hidden="true" />
        </Button>
      </form>
      <FilterSelect
        label="Status"
        value={query.status}
        onValueChange={setFilter('status')}
        options={Object.values(REQUEST_STATUSES).map((status) => ({
          value: status,
          label: STATUS_LABELS[status],
        }))}
      />
      <FilterSelect
        label="Prioridade"
        value={query.priority}
        onValueChange={setFilter('priority')}
        options={[
          ...Object.values(PRIORITIES).map((priority) => ({
            value: priority,
            label: PRIORITY_LABELS[priority],
          })),
          { value: UNSET_PRIORITY, label: 'Sem prioridade' },
        ]}
      />
      <FilterSelect
        label="Categoria"
        value={query.categoryId}
        onValueChange={setFilter('categoryId')}
        options={(categories.data ?? []).map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />
      <Button variant="ghost" className="h-10" onClick={clear} disabled={!hasFilters}>
        Limpar filtros
      </Button>
    </div>
  );
}
