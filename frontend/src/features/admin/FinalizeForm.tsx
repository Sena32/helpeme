import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FormError } from '@/components/forms/FormError';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateRequest } from '@/hooks/useRequests';
import {
  finalizeRequestSchema,
  RESOLUTION_MAX_LENGTH,
  type FinalizeRequestFormValues,
} from '@/schemas/admin-request';

// RF-11: resolving is final (RN-07), so it asks for confirmation.
export function FinalizeForm({ requestId }: { requestId: string }) {
  const resolutionId = useId();
  const [pending, setPending] = useState<FinalizeRequestFormValues | null>(null);
  const update = useUpdateRequest(requestId);
  const { register, handleSubmit, formState, control } = useForm<FinalizeRequestFormValues>({
    resolver: zodResolver(finalizeRequestSchema),
    defaultValues: { resolution: '' },
  });
  const resolution = useWatch({ control, name: 'resolution' });

  const confirm = async () => {
    if (!pending) return;
    setPending(null);
    await update.mutateAsync({ status: 'RESOLVED', resolution: pending.resolution });
    toast.success('Solicitação finalizada.');
  };

  return (
    <form
      aria-label="Finalizar"
      noValidate
      onSubmit={(event) => void handleSubmit(setPending)(event)}
      className="space-y-4"
    >
      <FormError error={update.error} />
      <div className="space-y-2">
        <Label htmlFor={resolutionId}>Resolução</Label>
        <Textarea
          id={resolutionId}
          rows={4}
          maxLength={RESOLUTION_MAX_LENGTH}
          aria-invalid={formState.errors.resolution ? true : undefined}
          aria-describedby={`${resolutionId}-hint`}
          {...register('resolution')}
        />
        <div id={`${resolutionId}-hint`} className="flex justify-between gap-4 text-xs">
          <p className="text-destructive">{formState.errors.resolution?.message}</p>
          <p aria-live="polite" className="shrink-0 text-muted-foreground tabular-nums">
            {resolution.length}/{RESOLUTION_MAX_LENGTH}
          </p>
        </div>
      </div>
      <Button type="submit" className="h-10" disabled={update.isPending}>
        {update.isPending ? 'Finalizando…' : 'Finalizar solicitação'}
      </Button>
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              Depois de finalizada, a solicitação não poderá mais ser alterada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="h-10"
              onClick={() => void confirm().catch(() => undefined)}
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
