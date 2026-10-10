import badgeSource from './badge.tsx?raw';
import buttonSource from './button.tsx?raw';
import dialogSource from './dialog.tsx?raw';
import dropdownMenuSource from './dropdown-menu.tsx?raw';
import selectSource from './select.tsx?raw';
import skeletonSource from './skeleton.tsx?raw';

// SPEC-06 "Hover discreto": accent is the highlight colour, never a hover, focus or loading background.
const ACCENT_STATE = /(?:focus|hover|data-\[state=open\]):(?:bg|text)-accent/;

describe('UI primitives use a discreet hover', () => {
  it.each([
    ['select', selectSource],
    ['dropdown-menu', dropdownMenuSource],
    ['button', buttonSource],
    ['badge', badgeSource],
    ['dialog', dialogSource],
  ])('%s does not hover with the accent colour', (_name, source) => {
    expect(source).not.toMatch(ACCENT_STATE);
  });

  it.each([
    ['select', selectSource],
    ['dropdown-menu', dropdownMenuSource],
  ])('%s items focus with the muted colour', (_name, source) => {
    expect(source).toMatch(/focus:bg-muted/);
  });

  it('ghost and outline buttons hover with the muted colour', () => {
    expect(buttonSource.match(/hover:bg-muted hover:text-foreground/g)).toHaveLength(2);
  });

  it('skeleton loads on the muted colour', () => {
    expect(skeletonSource).not.toMatch(/bg-accent/);
    expect(skeletonSource).toMatch(/bg-muted/);
  });
});
