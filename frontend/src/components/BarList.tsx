import { cn } from '@/lib/utils';

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  barClassName?: string;
}

const PERCENT = 100;

// Horizontal bars for a handful of counts: text label + visible value, so colour never carries meaning alone.
export function BarList({ title, items }: { title: string; items: BarListItem[] }) {
  const max = Math.max(0, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <figure aria-label={title} className="space-y-3">
      <figcaption className="text-base font-medium">{title}</figcaption>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(({ key, label, value, barClassName }) => (
            <li
              key={key}
              title={`${label}: ${value} (${total ? Math.round((value / total) * PERCENT) : 0}%)`}
              className="space-y-1"
            >
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{label}</span>
                <span className="font-medium tabular-nums">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  data-testid="bar"
                  className={cn('h-2 rounded-full bg-primary', barClassName)}
                  style={{ width: `${max ? (value / max) * PERCENT : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
