import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/hooks/useTheme';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { mockSystemDarkMode } from '@/test/match-media';
import { ThemeToggle } from './ThemeToggle';

async function choose(option: 'Claro' | 'Escuro' | 'Sistema') {
  await userEvent.click(screen.getByRole('button', { name: /^Tema:/ }));
  await userEvent.click(await screen.findByRole('menuitemradio', { name: option }));
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockSystemDarkMode(false);
  });

  it('switches to dark mode and persists it', async () => {
    render(<ThemeToggle />, { wrapper: ThemeProvider });

    await choose('Escuro');

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'Tema: Escuro' })).toBeInTheDocument();
  });

  it('can go back to following the operating system', async () => {
    mockSystemDarkMode(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<ThemeToggle />, { wrapper: ThemeProvider });
    expect(document.documentElement).not.toHaveClass('dark');

    await choose('Sistema');

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('marks the current preference in the menu', async () => {
    render(<ThemeToggle />, { wrapper: ThemeProvider });

    await userEvent.click(screen.getByRole('button', { name: 'Tema: Sistema' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Sistema' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Escuro' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});
