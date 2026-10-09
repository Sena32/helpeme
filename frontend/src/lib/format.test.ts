import { formatDate, formatDateTime, formatFileSize } from './format';

describe('format helpers (pt-BR)', () => {
  it('formats dates in the Brazilian locale and local time zone', () => {
    expect(formatDate('2026-03-10T15:30:00.000Z')).toBe('10/03/2026');
    expect(formatDateTime('2026-03-10T15:30:00.000Z')).toBe('10/03/2026, 12:30');
  });

  it('formats file sizes in KB/MB with a comma decimal', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1572864)).toBe('1,5 MB');
  });
});
