export const trimIfString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
