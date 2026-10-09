import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSystemDarkMode } from '@/test/match-media';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockSystemDarkMode(false);
  });

  it('switches from light to dark mode on click', async () => {
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeInTheDocument();
  });
});
