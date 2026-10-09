import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { DEFAULT_CATEGORY_NAMES } from './categories.constants';
import { CategorySummary } from './categories.types';

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
}
