import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FormError } from '@/components/forms/FormError';
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
import { Textarea } from '@/components/ui/textarea';
import { useUpdateRequest } from '@/hooks/useRequests';
import { LIVE_VALIDATION } from '@/lib/forms';
import {
  finalizeRequestSchema,
  RESOLUTION_MAX_LENGTH,
  type FinalizeRequestFormValues,
} from '@/schemas/admin-request';

const EMPTY_FORM: FinalizeRequestFormValues = { resolution: '' };

// RF-11 / AC-41: the modal is both the form and the confirmation, since RESOLVED is final (RN-07).
// Rendered only for requests in progress.
export function FinalizeForm({ requestId }: { requestId: string }) {
  const resolutionId = useId();
  const [isOpen, setOpen] = useState(false);
  const update = useUpdateRequest(requestId);
  const { register, handleSubmit, formState, control, reset } = useForm<FinalizeRequestFormValues>({
    ...LIVE_VALIDATION,
    resolver: zodResolver(finalizeRequestSchema),
    defaultValues: EMPTY_FORM,
  });
  const resolution = useWatch({ control, name: 'resolution' });

  const changeOpen = (open: boolean) => {
    setOpen(open);
    if (!open) {
      reset(EMPTY_FORM);
      update.reset();
    }
  };
  const submit = handleSubmit(async (values) => {
    await update.mutateAsync({ status: 'RESOLVED', resolution: values.resolution });
    toast.success('Solicitação finalizada.');
    setOpen(false);
  });

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 bg-accent text-accent-foreground hover:bg-accent/90">
          <CheckCircle2 aria-hidden="true" />
          Finalizar solicitação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar solicitação</DialogTitle>
          <DialogDescription>
            Depois de finalizada, a solicitação não poderá mais ser alterada.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => void submit(event).catch(() => undefined)}
          className="space-y-4"
        >
          <FormError error={update.error} />
          <div className="space-y-2">
            <Label htmlFor={resolutionId}>Resolução</Label>
            <Textarea
              id={resolutionId}
              rows={5}
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-10 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={update.isPending}
            >
              {update.isPending ? 'Finalizando…' : 'Finalizar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
