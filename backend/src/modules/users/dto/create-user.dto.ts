import { IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { NewAccountDto } from './new-account.dto';

export class CreateUserDto extends NewAccountDto {
  @IsEnum(Role, { message: 'Perfil inválido. Use ADMIN ou USER.' })
  role!: Role;
}
