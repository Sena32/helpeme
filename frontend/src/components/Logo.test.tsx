import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('exposes the brand name to assistive technologies', () => {
    render(<Logo />);

    expect(screen.getByRole('img', { name: 'HelpeMe' })).toBeInTheDocument();
  });

  it('hides the wordmark when compact', () => {
    render(<Logo compact />);

    expect(screen.queryByText('Helpe')).not.toBeInTheDocument();
  });
});
