import { toast } from 'sonner';
import { PriorityBadge } from '@/components/RequestBadges';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateRequest } from '@/hooks/useRequests';
import { PRIORITIES, type Priority, type RequestListItem } from '@/types/requests';

function isPriority(value: string): value is Priority {
  return Object.values(PRIORITIES).some((priority) => priority === value);
}

// UI-02 / AC-39: quick classification from the table; finalized requests are read-only (RN-09).
export function PrioritySelectCell({ item }: { item: RequestListItem }) {
  const update = useUpdateRequest(item.id);
  if (item.status === 'RESOLVED') return <PriorityBadge priority={item.priority} />;

  const change = async (value: string) => {
    if (!isPriority(value) || value === item.priority) return;
    try {
      await update.mutateAsync({ priority: value });
      toast.success('Prioridade atualizada.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível atualizar a prioridade.',
      );
    }
  };

  return (
    // Keeps clicks (including the portal options) from reaching the row's navigation handler.
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={item.priority ?? ''}
        onValueChange={(value) => void change(value)}
        disabled={update.isPending}
      >
        <SelectTrigger aria-label={`Prioridade de ${item.title}`} className="h-10 w-40">
          <SelectValue placeholder={<PriorityBadge priority={null} />} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(PRIORITIES).map((priority) => (
            <SelectItem key={priority} value={priority}>
              <PriorityBadge priority={priority} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
