import { isStrongPassword } from './password-policy';

describe('isStrongPassword (RN-02)', () => {
  it('accepts a password with upper, lower, digit, special and 8+ chars', () => {
    expect(isStrongPassword('Admin123@')).toBe(true);
  });

  it.each([
    ['shorter than 8 chars', 'Ab1@xyz'],
    ['without uppercase', 'admin123@'],
    ['without lowercase', 'ADMIN123@'],
    ['without digit', 'AdminAdm@'],
    ['without special char', 'Admin1234'],
  ])('rejects a password %s', (_reason, password) => {
    expect(isStrongPassword(password)).toBe(false);
  });
});
