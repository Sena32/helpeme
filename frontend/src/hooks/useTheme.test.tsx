import { act, renderHook } from '@testing-library/react';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { mockSystemDarkMode } from '@/test/match-media';
import { ThemeProvider, useTheme } from './useTheme';

const wrapper = ThemeProvider;

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockSystemDarkMode(false);
  });

  it('starts from the persisted preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('applies and persists a new preference', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTheme('dark'));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('uses the system preference when set to system', () => {
    mockSystemDarkMode(true);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('shares one theme between every consumer under the provider', () => {
    const { result } = renderHook(() => ({ first: useTheme(), second: useTheme() }), { wrapper });

    act(() => result.current.first.setTheme('dark'));

    expect(result.current.second.resolvedTheme).toBe('dark');
  });

  it('fails loudly when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });
});
