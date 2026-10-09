import { validateEnv } from './env.schema';
import { validEnv } from '../../test/env.fixture';

describe('validateEnv', () => {
  it('coerces numeric and boolean variables', () => {
    const env = validateEnv(validEnv);

    expect(env.BACKEND_PORT).toBe(3000);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.RUN_SEED).toBe(false);
    expect(env.MAX_UPLOAD_SIZE_MB).toBe(5);
  });

  it('fails fast when a required variable is missing', () => {
    const { JWT_SECRET: _omitted, ...incompleteEnv } = validEnv;

    expect(() => validateEnv(incompleteEnv)).toThrow(/JWT_SECRET/);
  });

  it('rejects an invalid boolean value', () => {
    expect(() => validateEnv({ ...validEnv, COOKIE_SECURE: 'yes' })).toThrow(/COOKIE_SECURE/);
  });

  it('rejects a non-numeric port', () => {
    expect(() => validateEnv({ ...validEnv, BACKEND_PORT: 'abc' })).toThrow(/BACKEND_PORT/);
  });

  it('treats the test user seed variables as optional', () => {
    const {
      SEED_USER_NAME: _name,
      SEED_USER_EMAIL: _email,
      SEED_USER_PASSWORD: _password,
      ...withoutSeedUser
    } = validEnv;

    expect(validateEnv(withoutSeedUser).SEED_USER_EMAIL).toBeUndefined();
  });

  it('rejects a partially configured test user seed', () => {
    const { SEED_USER_PASSWORD: _password, ...partial } = validEnv;

    expect(() => validateEnv(partial)).toThrow(/SEED_USER/);
  });

  it('rejects an invalid test user email', () => {
    expect(() => validateEnv({ ...validEnv, SEED_USER_EMAIL: 'invalido' })).toThrow(
      /SEED_USER_EMAIL/,
    );
  });
});
