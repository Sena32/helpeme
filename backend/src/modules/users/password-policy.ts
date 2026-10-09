export const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_REQUIREMENTS = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];

export const WEAK_PASSWORD_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.';

export function isStrongPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}
