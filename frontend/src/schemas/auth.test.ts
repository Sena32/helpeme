import { loginSchema, PASSWORD_RULES, registerSchema } from './auth';

const issuesOf = (result: {
  success: boolean;
  error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
}) =>
  Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]),
  );

describe('auth schemas', () => {
  it('requires a valid email and a password to log in', () => {
    expect(issuesOf(loginSchema.safeParse({ email: 'x', password: '' }))).toEqual({
      email: 'Informe um e-mail válido.',
      password: 'Informe a senha.',
    });
  });

  it('accepts a registration that follows RN-02 and trims the name', () => {
    const result = registerSchema.safeParse({
      name: '  Maria  ',
      email: 'maria@example.com',
      password: 'Senha123@',
    });

    expect(result.success && result.data.name).toBe('Maria');
  });

  it.each(['Ab1@xyz', 'senha123@', 'SENHA123@', 'SenhaSen@', 'Senha1234'])(
    'RN-02: rejects the weak password %s',
    (password) => {
      const result = registerSchema.safeParse({
        name: 'Maria',
        email: 'maria@example.com',
        password,
      });

      expect(issuesOf(result).password).toBe(
        'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.',
      );
    },
  );

  it('rejects names shorter than 2 or longer than 100 chars', () => {
    expect(
      issuesOf(registerSchema.safeParse({ name: ' M ', email: 'a@b.com', password: 'Senha123@' }))
        .name,
    ).toBe('O nome deve ter entre 2 e 100 caracteres.');
  });

  it('exposes each password rule for the live checklist', () => {
    expect(PASSWORD_RULES.map((rule) => [rule.label, rule.test('Senha123@')])).toEqual([
      ['Mínimo de 8 caracteres', true],
      ['Uma letra maiúscula', true],
      ['Uma letra minúscula', true],
      ['Um número', true],
      ['Um caractere especial', true],
    ]);
    expect(PASSWORD_RULES.filter((rule) => rule.test('abc')).map((rule) => rule.label)).toEqual([
      'Uma letra minúscula',
    ]);
  });
});
