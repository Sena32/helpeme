const LOCALE = 'pt-BR';
const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short' });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'short',
  timeStyle: 'short',
});
const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_PER_KILOBYTE) return `${bytes} B`;
  if (bytes < BYTES_PER_MEGABYTE)
    return `${decimalFormatter.format(bytes / BYTES_PER_KILOBYTE)} KB`;
  return `${decimalFormatter.format(bytes / BYTES_PER_MEGABYTE)} MB`;
}
