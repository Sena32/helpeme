import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Priority } from '../../../common/enums/priority.enum';
import { RequestStatus } from '../../../common/enums/request-status.enum';
import { trimIfString } from '../../../common/transformers/trim.transformer';
import {
  ListRequestsQuery,
  PriorityFilter,
  REQUEST_SORT_FIELDS,
  RequestSortField,
  SORT_ORDERS,
  SortOrder,
  UNSET_PRIORITY_FILTER,
} from '../request-list-query';

const SEARCH_MAX_LENGTH = 100;

export class ListRequestsQueryDto implements ListRequestsQuery {
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
  @IsIn(REQUEST_SORT_FIELDS)
  sortBy?: RequestSortField;

  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsIn([...Object.values(Priority), UNSET_PRIORITY_FILTER])
  priority?: PriorityFilter;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(SEARCH_MAX_LENGTH)
  search?: string;
}
