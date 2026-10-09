import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import { LoginDto } from '../../auth/dto/login.dto';
import { USER_NAME_MAX_LENGTH, USER_NAME_MIN_LENGTH } from '../schemas/user.model';

export class NewAccountDto extends LoginDto {
  @Transform(trimIfString)
  @IsString()
  @Length(USER_NAME_MIN_LENGTH, USER_NAME_MAX_LENGTH, {
    message: 'O nome deve ter entre 2 e 100 caracteres.',
  })
  name!: string;
}
