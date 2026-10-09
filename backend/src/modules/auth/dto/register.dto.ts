import { Transform } from 'class-transformer';
import { Allow, IsString, Length } from 'class-validator';
import { USER_NAME_MAX_LENGTH, USER_NAME_MIN_LENGTH } from '../../users/schemas/user.model';
import { LoginDto, trimIfString } from './login.dto';

export class RegisterDto extends LoginDto {
  @Transform(trimIfString)
  @IsString()
  @Length(USER_NAME_MIN_LENGTH, USER_NAME_MAX_LENGTH, {
    message: 'O nome deve ter entre 2 e 100 caracteres.',
  })
  name!: string;

  // RN-03/AC-04: accepted so the request is not rejected, but never forwarded (always USER).
  @Allow()
  role?: unknown;
}
