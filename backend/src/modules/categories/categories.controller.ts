import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CategoriesService } from './categories.service';
import { CategorySummary } from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(): Promise<CategorySummary[]> {
    return this.categoriesService.listActive();
  }

  @Roles(Role.Admin)
  @Post()
  create(@Body() body: CreateCategoryDto): Promise<CategorySummary> {
    return this.categoriesService.create(body.name);
  }

  @Roles(Role.Admin)
  @Post('deactivate')
  deactivate(@Body() body: { categoryId: string }): Promise<void> {
    return this.categoriesService.deactivate(body.categoryId);
  }
}
