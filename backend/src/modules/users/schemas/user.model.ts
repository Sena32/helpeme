import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 100;

@Schema({ collection: 'users', timestamps: true, versionKey: false, strict: true })
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: USER_NAME_MIN_LENGTH,
    maxlength: USER_NAME_MAX_LENGTH,
  })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, enum: Object.values(Role), default: Role.User })
  role!: Role;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

// API-16 lists users newest first; _id keeps pagination stable on equal dates.
UserSchema.index({ createdAt: -1, _id: -1 });
