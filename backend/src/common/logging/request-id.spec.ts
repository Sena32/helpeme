import { resolveRequestId } from './request-id';

describe('resolveRequestId', () => {
  const generate = () => 'generated-id';

  it('reuses a well-formed incoming X-Request-Id', () => {
    expect(resolveRequestId('abc-123_DEF', generate)).toBe('abc-123_DEF');
  });

  it.each([
    ['missing', undefined],
    ['multiple values', ['a', 'b']],
    ['unsafe characters', 'abc\ninjected'],
    ['too long', 'x'.repeat(129)],
  ])('generates a new id when the header is %s', (_reason, header) => {
    expect(resolveRequestId(header, generate)).toBe('generated-id');
  });
});
