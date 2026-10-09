import { render, screen, within } from '@testing-library/react';
import { BarList } from './BarList';

describe('BarList', () => {
  it('renders a captioned list with text labels, values and proportional bars', () => {
    render(
      <BarList
        title="Solicitações por categoria"
        items={[
          { key: 'infra', label: 'Infra', value: 4 },
          { key: 'rh', label: 'RH', value: 2 },
        ]}
      />,
    );

    const figure = screen.getByRole('figure', { name: 'Solicitações por categoria' });
    const rows = within(figure).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['Infra4', 'RH2']);
    expect(within(rows[0]).getByTestId('bar')).toHaveStyle({ width: '100%' });
    expect(within(rows[1]).getByTestId('bar')).toHaveStyle({ width: '50%' });
    expect(rows[1]).toHaveAttribute('title', 'RH: 2 (33%)');
  });

  it('shows an empty message when there is nothing to plot', () => {
    render(<BarList title="Solicitações por categoria" items={[]} />);

    expect(screen.getByText('Sem dados para exibir.')).toBeInTheDocument();
  });
});
