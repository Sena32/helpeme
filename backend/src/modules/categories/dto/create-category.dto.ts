import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import { CATEGORY_NAME_MAX_LENGTH, CATEGORY_NAME_MIN_LENGTH } from '../categories.constants';

export class CreateCategoryDto {
  @Transform(trimIfString)
  @IsString()
  @Length(CATEGORY_NAME_MIN_LENGTH, CATEGORY_NAME_MAX_LENGTH, {
    message: 'O nome da categoria deve ter entre 2 e 50 caracteres.',
  })
  name!: string;
}
