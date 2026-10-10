import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { DEFAULT_CATEGORY_NAMES } from './categories.constants';
import { CategorySummary, CategoryWithStatus } from './categories.types';

export const CATEGORY_NOT_FOUND_MESSAGE = 'Categoria não encontrada.';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  create(name: string): Promise<CategorySummary> {
    return this.categoriesRepository.create(name.trim());
  }

  listActive(): Promise<CategorySummary[]> {
    return this.categoriesRepository.findActive();
  }

  findActiveById(id: string): Promise<CategorySummary | null> {
    return this.categoriesRepository.findActiveById(id);
  }

  ensureDefaults(): Promise<void> {
    return this.categoriesRepository.ensureDefaults(DEFAULT_CATEGORY_NAMES);
  }

  listAll(): Promise<CategoryWithStatus[]> {
    return this.categoriesRepository.findAll();
  }

  async deactivate(categoryId: string): Promise<CategoryWithStatus> {
    const category = await this.categoriesRepository.deactivate(categoryId);
    if (!category) throw new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
    return category;
  }
}
