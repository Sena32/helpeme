import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { parseThemePreference, THEME_PREFERENCES, type ThemePreference } from '@/lib/theme';

const THEME_OPTIONS: Record<ThemePreference, { label: string; icon: LucideIcon }> = {
  light: { label: 'Claro', icon: Sun },
  dark: { label: 'Escuro', icon: Moon },
  system: { label: 'Sistema', icon: Monitor },
};

// Rules 03: light | dark | system, persisted.
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const TriggerIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          aria-label={`Tema: ${THEME_OPTIONS[theme].label}`}
        >
          <TriggerIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(parseThemePreference(value))}
        >
          {THEME_PREFERENCES.map((preference) => {
            const { label, icon: Icon } = THEME_OPTIONS[preference];
            return (
              <DropdownMenuRadioItem key={preference} value={preference}>
                <Icon aria-hidden="true" />
                {label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
