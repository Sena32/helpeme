import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import { USER_NAME_MAX_LENGTH, USER_NAME_MIN_LENGTH } from '../schemas/user.model';
import { UserChanges } from '../users.types';

// RF-17: password is not editable here (Q-31), so the whitelist rejects it with 400.
export class UpdateUserDto implements UserChanges {
  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @Length(USER_NAME_MIN_LENGTH, USER_NAME_MAX_LENGTH, {
    message: 'O nome deve ter entre 2 e 100 caracteres.',
  })
  name?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Perfil inválido. Use ADMIN ou USER.' })
  role?: Role;
}
