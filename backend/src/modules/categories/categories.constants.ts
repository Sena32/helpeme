export const DEFAULT_CATEGORY_NAMES = [
  'Infra',
  'Desenvolvimento',
  'RH',
  'Suporte Técnico',
  'Outros',
] as const;

export const CATEGORY_NAME_MIN_LENGTH = 2;
export const CATEGORY_NAME_MAX_LENGTH = 50;

// RN-04: names compare case-insensitively in Portuguese (index and queries must share it).
export const CATEGORY_NAME_COLLATION = { locale: 'pt', strength: 2 } as const;

export const CATEGORY_ALREADY_EXISTS_MESSAGE = 'Já existe uma categoria com este nome.';
