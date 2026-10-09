import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, mongo } from 'mongoose';
import { User, UserDocument } from './schemas/user.model';
import { NewUserRecord, PublicUser, UserCredentials } from './users.types';

export const EMAIL_ALREADY_REGISTERED_MESSAGE = 'E-mail já cadastrado.';
const DUPLICATE_KEY_ERROR_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublicUser(document: UserDocument): PublicUser {
  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    role: document.role,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async existsByEmail(email: string): Promise<boolean> {
    const match = await this.userModel.exists({ email: normalizeEmail(email) });
    return match !== null;
  }

  async create(record: NewUserRecord): Promise<PublicUser> {
    try {
      return toPublicUser(await this.userModel.create(record));
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
      throw error;
    }
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const document = await this.userModel
      .findOne({ email: normalizeEmail(email) })
      .select('+passwordHash');
    if (!document) return null;
    return { user: toPublicUser(document), passwordHash: document.passwordHash };
  }

  async findById(id: string): Promise<PublicUser | null> {
    if (!isValidObjectId(id)) return null;
    const document = await this.userModel.findById(id);
    return document ? toPublicUser(document) : null;
  }
}
