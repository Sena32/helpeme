import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Priority } from '../../../common/enums/priority.enum';
import { RequestStatus } from '../../../common/enums/request-status.enum';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import { AdminRequestPatch } from '../request-update-plan';
import { ADMIN_NOTE_MAX_LENGTH, RESOLUTION_MAX_LENGTH } from '../requests.constants';

export class UpdateRequestDto implements AdminRequestPatch {
  @IsOptional()
  @IsEnum(Priority, { message: 'Prioridade inválida. Use HIGH, MEDIUM ou LOW.' })
  priority?: Priority;

  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status inválido.' })
  status?: RequestStatus;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(ADMIN_NOTE_MAX_LENGTH, { message: 'A observação deve ter no máximo 500 caracteres.' })
  adminNote?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(RESOLUTION_MAX_LENGTH, { message: 'A resolução deve ter no máximo 1000 caracteres.' })
  resolution?: string;
}
