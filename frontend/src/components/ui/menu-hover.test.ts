import dropdownMenuSource from './dropdown-menu.tsx?raw';
import selectSource from './select.tsx?raw';

// SPEC-06 "Menus suspensos": accent is the highlight colour, never the hover of menu items.
describe('dropdown menus use a discreet hover', () => {
  it.each([
    ['select', selectSource],
    ['dropdown-menu', dropdownMenuSource],
  ])('%s items do not hover with the accent colour', (_name, source) => {
    expect(source).not.toMatch(/(?:focus|hover|data-\[state=open\]):(?:bg|text)-accent/);
    expect(source).toMatch(/focus:bg-muted/);
  });
});
