export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const THEME_STORAGE_KEY = 'helpeme-theme';
export const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
export const DARK_THEME_CLASS = 'dark';

export function parseThemePreference(storedValue: string | null): ThemePreference {
  const preference = THEME_PREFERENCES.find((option) => option === storedValue);
  return preference ?? 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference !== 'system') return preference;
  return systemPrefersDark ? 'dark' : 'light';
}
