import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { trimIfString } from '../../../common/transformers/trim.transformer';

export class LoginDto {
  @Transform(trimIfString)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Informe a senha.' })
  password!: string;
}
