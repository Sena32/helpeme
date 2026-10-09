import { useCallback, useEffect, useState } from 'react';
import {
  DARK_COLOR_SCHEME_QUERY,
  DARK_THEME_CLASS,
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme';

function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

function persistPreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage may be blocked (private mode); the theme still applies for this session.
  }
}

function useSystemPrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_COLOR_SCHEME_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersDark;
}

export function useTheme(): {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
} {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredPreference);
  const resolvedTheme = resolveTheme(theme, useSystemPrefersDark());

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_THEME_CLASS, resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = useCallback((preference: ThemePreference) => {
    persistPreference(preference);
    setThemeState(preference);
  }, []);

  return { theme, resolvedTheme, setTheme };
}
