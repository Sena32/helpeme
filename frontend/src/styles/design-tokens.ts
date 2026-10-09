export type ThemeName = 'light' | 'dark';
export type ThemeTokens = Record<string, string>;

const THEME_SELECTORS: Record<ThemeName, string> = { light: ':root', dark: '.dark' };
const HEX_TOKEN_PATTERN = /--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;
const HEX_CHANNELS = [1, 3, 5] as const;
const CONTRAST_OFFSET = 0.05;

export function readThemeTokens(stylesheet: string, themeName: ThemeName): ThemeTokens {
  const blockStart = stylesheet.indexOf(`${THEME_SELECTORS[themeName]} {`);
  if (blockStart === -1) return {};

  const block = stylesheet.slice(blockStart, stylesheet.indexOf('}', blockStart));
  return Object.fromEntries(
    [...block.matchAll(HEX_TOKEN_PATTERN)].map(([, name, hex]) => [name, hex]),
  );
}

function linearize(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = HEX_CHANNELS.map((start) =>
    linearize(parseInt(hex.slice(start, start + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(firstHex: string, secondHex: string): number {
  const [lighter, darker] = [relativeLuminance(firstHex), relativeLuminance(secondHex)].sort(
    (first, second) => second - first,
  );
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
}
