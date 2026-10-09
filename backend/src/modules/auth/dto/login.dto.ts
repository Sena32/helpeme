import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

const trimIfString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class LoginDto {
  @Transform(trimIfString)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Informe a senha.' })
  password!: string;
}

export { trimIfString };
