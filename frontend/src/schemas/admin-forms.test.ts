import { categorySchema, createUserSchema } from './admin-forms';

describe('admin form schemas', () => {
  it('RN-04: trims the category name and requires 2 to 50 chars', () => {
    expect(categorySchema.safeParse({ name: '  Segurança ' }).data).toEqual({ name: 'Segurança' });
    expect(categorySchema.safeParse({ name: ' a ' }).error?.issues[0]?.message).toBe(
      'O nome da categoria deve ter entre 2 e 50 caracteres.',
    );
    expect(categorySchema.safeParse({ name: 'x'.repeat(51) }).success).toBe(false);
  });

  it('requires a role besides the account fields and RN-02 password', () => {
    const base = { name: 'Ana Admin', email: 'ana@example.com', password: 'Senha123@' };

    expect(createUserSchema.safeParse({ ...base, role: 'ADMIN' }).success).toBe(true);
    expect(createUserSchema.safeParse({ ...base, role: 'ROOT' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, password: 'abc', role: 'USER' }).success).toBe(
      false,
    );
  });
});
