import { Transform } from 'class-transformer';
import { IsMongoId, IsString, Length } from 'class-validator';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import {
  REQUEST_DESCRIPTION_MAX_LENGTH,
  REQUEST_DESCRIPTION_MIN_LENGTH,
  REQUEST_TITLE_MAX_LENGTH,
  REQUEST_TITLE_MIN_LENGTH,
} from '../requests.constants';

export class CreateRequestDto {
  @Transform(trimIfString)
  @IsString()
  @Length(REQUEST_TITLE_MIN_LENGTH, REQUEST_TITLE_MAX_LENGTH, {
    message: 'O título deve ter entre 5 e 120 caracteres.',
  })
  title!: string;

  @IsMongoId({ message: 'Categoria inválida.' })
  categoryId!: string;

  @Transform(trimIfString)
  @IsString()
  @Length(REQUEST_DESCRIPTION_MIN_LENGTH, REQUEST_DESCRIPTION_MAX_LENGTH, {
    message: 'A descrição deve ter entre 50 e 1000 caracteres.',
  })
  description!: string;
}
