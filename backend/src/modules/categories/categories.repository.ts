import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { CATEGORY_ALREADY_EXISTS_MESSAGE, CATEGORY_NAME_COLLATION } from './categories.constants';
import { CategorySummary } from './categories.types';
import { Category } from './schemas/category.model';

const DUPLICATE_KEY_ERROR_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE;
}

function toSummary(category: { _id: { toString(): string }; name: string }): CategorySummary {
  return { id: category._id.toString(), name: category.name };
}

@Injectable()
export class CategoriesRepository {
  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<Category>) {}

  async create(name: string): Promise<CategorySummary> {
    try {
      return toSummary(await this.categoryModel.create({ name }));
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictException(CATEGORY_ALREADY_EXISTS_MESSAGE);
      throw error;
    }
  }

  async findActive(): Promise<CategorySummary[]> {
    const categories = await this.categoryModel
      .find({ isActive: true })
      .select('name')
      .collation(CATEGORY_NAME_COLLATION)
      .sort({ name: 1 })
      .lean();
    return categories.map(toSummary);
  }

  async ensureDefaults(names: readonly string[]): Promise<void> {
    await this.categoryModel.bulkWrite(
      names.map((name) => ({
        updateOne: {
          filter: { name },
          update: { $setOnInsert: { name, isDefault: true, isActive: true } },
          upsert: true,
          collation: CATEGORY_NAME_COLLATION,
        },
      })),
    );
  }
}
