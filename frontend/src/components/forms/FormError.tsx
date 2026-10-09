import { isApiError } from '@/api/http-client';

const FALLBACK_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const messages = isApiError(error) ? error.messages : [];

  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {messages.length > 1 ? (
        <ul className="list-disc pl-4">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        <p>{messages[0] ?? FALLBACK_MESSAGE}</p>
      )}
    </div>
  );
}
