import { IsIn, IsOptional } from 'class-validator';

export const BOOLEAN_FLAGS = ['true', 'false'] as const;

export class ListCategoriesQueryDto {
  @IsOptional()
  @IsIn(BOOLEAN_FLAGS, { message: 'includeInactive deve ser true ou false.' })
  includeInactive?: (typeof BOOLEAN_FLAGS)[number];
}
