import { LIVE_VALIDATION } from './forms';

const sources = import.meta.glob<string>(['../**/*.tsx', '!../**/*.test.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('RN-13: live validation', () => {
  it('validates on every change', () => {
    expect(LIVE_VALIDATION).toEqual({ mode: 'onChange' });
  });

  it('is used by every form built with useForm', () => {
    const forms = Object.entries(sources).filter(([, source]) => source.includes('useForm<'));

    expect(forms.length).toBeGreaterThanOrEqual(7);
    expect(
      forms.filter(([, source]) => !source.includes('...LIVE_VALIDATION')).map(([path]) => path),
    ).toEqual([]);
  });
});
