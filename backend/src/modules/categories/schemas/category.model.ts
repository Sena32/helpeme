import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  CATEGORY_NAME_COLLATION,
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_NAME_MIN_LENGTH,
} from '../categories.constants';

@Schema({ collection: 'categories', timestamps: true, versionKey: false, strict: true })
export class Category {
  @Prop({
    required: true,
    trim: true,
    minlength: CATEGORY_NAME_MIN_LENGTH,
    maxlength: CATEGORY_NAME_MAX_LENGTH,
  })
  name!: string;

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type CategoryDocument = HydratedDocument<Category>;

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ name: 1 }, { unique: true, collation: CATEGORY_NAME_COLLATION });
