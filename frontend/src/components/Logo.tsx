import logoIconUrl from '@/assets/logo-icon.svg';
import { cn } from '@/lib/utils';

type LogoProps = { compact?: boolean; className?: string };

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="HelpeMe"
      className={cn('inline-flex items-center gap-3', className)}
    >
      <img src={logoIconUrl} alt="" className="size-10" />
      {!compact && (
        <span aria-hidden="true" className="text-2xl font-bold tracking-tight text-foreground">
          Helpe<span className="text-primary">Me</span>
        </span>
      )}
    </span>
  );
}
