import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import { ListUsersQuery } from '../users.types';

const SEARCH_MAX_LENGTH = 100;

export class ListUsersQueryDto implements ListUsersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(SEARCH_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Perfil inválido. Use ADMIN ou USER.' })
  role?: Role;
}
