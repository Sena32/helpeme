import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/render';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage (UI-09)', () => {
  it('explains the page does not exist and offers a way back', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>Início</p>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>,
      { route: '/nao-existe' },
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Voltar ao início' }));
    expect(await screen.findByText('Início')).toBeInTheDocument();
  });
});
