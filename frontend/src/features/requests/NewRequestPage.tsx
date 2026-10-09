import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { FormError } from '@/components/forms/FormError';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRequest } from '@/hooks/useRequests';
import {
  createRequestSchema,
  DESCRIPTION_MAX_LENGTH,
  type CreateRequestFormValues,
} from '@/schemas/request';
import { AttachmentPicker } from './AttachmentPicker';
import { CategorySelectField } from './CategorySelectField';
import { requestDetailPath } from './UserRequestsTable';
import { useAttachmentSelection } from './useAttachmentSelection';

// UI-07
export function NewRequestPage() {
  const descriptionId = useId();
  const navigate = useNavigate();
  const createRequest = useCreateRequest();
  const selection = useAttachmentSelection();
  const { register, handleSubmit, control, formState } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { title: '', categoryId: '', description: '' },
  });
  const { errors } = formState;
  const description = useWatch({ control, name: 'description' });

  const submit = handleSubmit(async (values) => {
    const created = await createRequest.mutateAsync({
      ...values,
      files: selection.attachments.map(({ file }) => file),
    });
    toast.success('Solicitação enviada com sucesso.');
    void navigate(requestDetailPath(created.id), { replace: true });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Nova solicitação</h1>
      <Card className="rounded-xl">
        <CardContent>
          <form
            noValidate
            onSubmit={(event) => void submit(event).catch(() => undefined)}
            className="space-y-5"
          >
            <FormError error={createRequest.error} />
            <FormField label="Título" error={errors.title?.message} {...register('title')} />
            <CategorySelectField control={control} error={errors.categoryId?.message} />
            <div className="space-y-2">
              <Label htmlFor={descriptionId}>Descrição</Label>
              <Textarea
                id={descriptionId}
                rows={6}
                maxLength={DESCRIPTION_MAX_LENGTH}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={`${descriptionId}-counter${errors.description ? ` ${descriptionId}-error` : ''}`}
                {...register('description')}
              />
              <div className="flex justify-between gap-4 text-xs">
                <p id={`${descriptionId}-error`} className="text-destructive">
                  {errors.description?.message}
                </p>
                <p
                  id={`${descriptionId}-counter`}
                  aria-live="polite"
                  className="shrink-0 text-muted-foreground tabular-nums"
                >
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </div>
            </div>
            <AttachmentPicker
              attachments={selection.attachments}
              errors={selection.errors}
              onAdd={(files) => void selection.add(files)}
              onRemove={selection.remove}
            />
            <Button
              type="submit"
              className="h-10 w-full sm:w-auto"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? 'Enviando…' : 'Enviar solicitação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
