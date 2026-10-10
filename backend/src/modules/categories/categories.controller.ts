import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { FORBIDDEN_MESSAGE } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CategoriesService } from './categories.service';
import { CategorySummary, CategoryWithStatus } from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // API-06: active categories for everyone; inactive ones too only for admins (UI-04).
  @Get()
  list(
    @Query() query: ListCategoriesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CategorySummary[] | CategoryWithStatus[]> {
    if (query.includeInactive !== 'true') return this.categoriesService.listActive();
    if (user.role !== Role.Admin) throw new ForbiddenException(FORBIDDEN_MESSAGE);
    return this.categoriesService.listAll();
  }

  @Roles(Role.Admin)
  @Post()
  create(@Body() body: CreateCategoryDto): Promise<CategorySummary> {
    return this.categoriesService.create(body.name);
  }

  // API-15
  @Roles(Role.Admin)
  @Patch(':categoryId/deactivate')
  deactivate(@Param('categoryId') categoryId: string): Promise<CategoryWithStatus> {
    return this.categoriesService.deactivate(categoryId);
  }
}
