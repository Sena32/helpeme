import stylesheet from '../index.css?raw';
import { blendOver, contrastRatio, readThemeTokens } from './design-tokens';

const SPEC_06_TOKENS = {
  light: {
    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    'muted-foreground': '#475569',
    border: '#E2E8F0',
    primary: '#4F46E5',
    'primary-foreground': '#FFFFFF',
    accent: '#0F766E',
    destructive: '#B91C1C',
    ring: '#4F46E5',
    success: '#15803D',
    warning: '#B45309',
  },
  dark: {
    background: '#0B1020',
    foreground: '#E5E7EB',
    card: '#121A2F',
    'muted-foreground': '#9CA3AF',
    border: '#243049',
    primary: '#818CF8',
    'primary-foreground': '#0B1020',
    accent: '#2DD4BF',
    destructive: '#F87171',
    ring: '#A5B4FC',
    success: '#4ADE80',
    warning: '#FBBF24',
  },
} as const;

const NORMAL_TEXT_MIN_CONTRAST = 4.5;
const TEXT_PAIRS: ReadonlyArray<[text: string, surface: string]> = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['primary-foreground', 'primary'],
  ['primary', 'background'],
  ['accent', 'background'],
  ['destructive', 'background'],
  ['success', 'background'],
  ['warning', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['success-foreground', 'success'],
  ['warning-foreground', 'warning'],
];

describe.each(['light', 'dark'] as const)('%s theme tokens', (themeName) => {
  const tokens = readThemeTokens(stylesheet, themeName);

  it('match the SPEC-06 palette', () => {
    for (const [name, hex] of Object.entries(SPEC_06_TOKENS[themeName])) {
      expect(tokens[name]?.toUpperCase(), name).toBe(hex);
    }
  });

  it.each(TEXT_PAIRS)('%s on %s meets WCAG AA contrast', (text, surface) => {
    expect(contrastRatio(tokens[text], tokens[surface])).toBeGreaterThanOrEqual(
      NORMAL_TEXT_MIN_CONTRAST,
    );
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
  });
});

// Tone text over a 10% tint of itself (active nav, avatar, inline alerts). warning/success tints
// fall to ~4.2:1 in light mode, so their badges are outlined instead (guarded in no-hardcoded-colors).
const TINT_OPACITY = 0.1;
const TINTED_TONES = ['primary', 'destructive'] as const;
const SURFACES = ['card', 'background'] as const;

describe.each(['light', 'dark'] as const)('%s tinted badges', (themeName) => {
  const tokens = readThemeTokens(stylesheet, themeName);

  it.each(TINTED_TONES.flatMap((tone) => SURFACES.map((surface) => [tone, surface] as const)))(
    '%s text on a 10 percent tint over %s meets AA',
    (tone, surface) => {
      const tint = blendOver(tokens[tone], tokens[surface], TINT_OPACITY);

      expect(contrastRatio(tokens[tone], tint)).toBeGreaterThanOrEqual(NORMAL_TEXT_MIN_CONTRAST);
    },
  );

  it('defines an overlay token for modal scrims', () => {
    expect(tokens.overlay).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('blendOver', () => {
  it('mixes a colour over a surface by opacity', () => {
    expect(blendOver('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});
