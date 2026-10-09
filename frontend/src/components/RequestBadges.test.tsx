import { render, screen } from '@testing-library/react';
import { PriorityBadge, StatusBadge } from './RequestBadges';

describe('request badges (SPEC-06 semantics)', () => {
  it.each([
    ['OPEN', 'Aberta'],
    ['IN_PROGRESS', 'Em resolução'],
    ['RESOLVED', 'Finalizada'],
  ] as const)('labels status %s as "%s"', (status, label) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each([
    ['HIGH', 'Alta'],
    ['MEDIUM', 'Média'],
    ['LOW', 'Baixa'],
  ] as const)('shows priority %s with a decorative icon and the text "%s"', (priority, label) => {
    const { container } = render(<PriorityBadge priority={priority} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows "Sem prioridade" for unclassified requests', () => {
    render(<PriorityBadge priority={null} />);

    expect(screen.getByText('Sem prioridade')).toBeInTheDocument();
  });
});
