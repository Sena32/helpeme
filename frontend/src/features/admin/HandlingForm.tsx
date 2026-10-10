import { zodResolver } from '@hookform/resolvers/zod';
import { LIVE_VALIDATION } from '@/lib/forms';
import { useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FormError } from '@/components/forms/FormError';
import { STATUS_LABELS } from '@/components/RequestBadges';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateRequest } from '@/hooks/useRequests';
import {
  ADMIN_NOTE_MAX_LENGTH,
  handlingSchema,
  type HandlingFormValues,
} from '@/schemas/admin-request';
import type { RequestDetails } from '@/types/requests';
import { buildHandlingPatch, editableStatuses, toHandlingValues } from './handling-patch';

export function HandlingForm({ request }: { request: RequestDetails }) {
  const ids = { status: useId(), note: useId() };
  const update = useUpdateRequest(request.id);
  const { control, register, handleSubmit, formState, reset } = useForm<HandlingFormValues>({
    ...LIVE_VALIDATION,
    resolver: zodResolver(handlingSchema),
    values: toHandlingValues(request),
  });
  const values = useWatch({ control });
  const patch = buildHandlingPatch(request, { ...toHandlingValues(request), ...values });
  const hasChanges = Object.keys(patch).length > 0;

  const submit = handleSubmit(async (submitted) => {
    const updated = await update.mutateAsync(buildHandlingPatch(request, submitted));
    reset(toHandlingValues(updated));
    toast.success('Alterações salvas.');
  });

  return (
    <form
      aria-label="Classificação e andamento"
      noValidate
      onSubmit={(event) => void submit(event).catch(() => undefined)}
      className="space-y-4"
    >
      <FormError error={update.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={ids.status}>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={ids.status} className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableStatuses(request.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={ids.note}>Observação</Label>
        <Textarea
          id={ids.note}
          rows={4}
          aria-invalid={formState.errors.adminNote ? true : undefined}
          aria-describedby={`${ids.note}-hint`}
          {...register('adminNote')}
        />
        <div id={`${ids.note}-hint`} className="flex justify-between gap-4 text-xs">
          <p className="text-destructive">{formState.errors.adminNote?.message}</p>
          <p aria-live="polite" className="shrink-0 text-muted-foreground tabular-nums">
            {values.adminNote?.length ?? 0}/{ADMIN_NOTE_MAX_LENGTH}
          </p>
        </div>
      </div>
      <Button type="submit" className="h-10" disabled={!hasChanges || update.isPending}>
        {update.isPending ? 'Salvando…' : 'Salvar alterações'}
      </Button>
    </form>
  );
}
