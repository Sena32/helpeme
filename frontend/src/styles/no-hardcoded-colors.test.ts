// AC-32 / rules 03: components use theme tokens only, so both themes stay consistent.
const sources = import.meta.glob<string>(
  ['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!../test/**'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
);

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const HARDCODED_COLOR = new RegExp(
  `#[0-9a-fA-F]{3,8}\\b|\\b(?:bg|text|border|ring|fill|stroke|outline|from|to)-(?:white|black|(?:${PALETTE})-\\d{2,3})\\b`,
);

describe('design tokens only', () => {
  it('finds source files to scan', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it('has no hard-coded colours in components', () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith('design-tokens.ts'))
      .flatMap(([path, source]) =>
        source
          .split('\n')
          .flatMap((line, index) => (HARDCODED_COLOR.test(line) ? [`${path}:${index + 1}`] : [])),
      );

    expect(offenders).toEqual([]);
  });

  it('never tints backgrounds with warning/success (their text would miss AA in light mode)', () => {
    const offenders = Object.entries(sources).filter(([, source]) =>
      /\bbg-(?:warning|success)\/\d+/.test(source),
    );

    expect(offenders.map(([path]) => path)).toEqual([]);
  });
});
