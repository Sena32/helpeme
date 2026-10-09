import { finalizeRequestSchema, handlingSchema } from './admin-request';

describe('admin handling schemas', () => {
  it('limits the admin note to 500 chars', () => {
    expect(
      handlingSchema.safeParse({ priority: '', status: 'OPEN', adminNote: 'n'.repeat(500) })
        .success,
    ).toBe(true);
    expect(
      handlingSchema.safeParse({ priority: '', status: 'OPEN', adminNote: 'n'.repeat(501) }).error
        ?.issues[0]?.message,
    ).toBe('A observação deve ter no máximo 500 caracteres.');
  });

  it('AC-21: requires a non-blank resolution of up to 1000 chars to finalize', () => {
    expect(finalizeRequestSchema.safeParse({ resolution: '   ' }).error?.issues[0]?.message).toBe(
      'Informe a resolução para finalizar.',
    );
    expect(
      finalizeRequestSchema.safeParse({ resolution: 'r'.repeat(1001) }).error?.issues[0]?.message,
    ).toBe('A resolução deve ter no máximo 1000 caracteres.');
    expect(finalizeRequestSchema.safeParse({ resolution: ' Ok ' }).data).toEqual({
      resolution: 'Ok',
    });
  });
});
