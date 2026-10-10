import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, mongo } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { User, UserDocument } from './schemas/user.model';
import { escapeRegExp } from '../requests/request-list-query';
import {
  NewUserRecord,
  PublicUser,
  UserChanges,
  UserCredentials,
  UserListOptions,
} from './users.types';

export const EMAIL_ALREADY_REGISTERED_MESSAGE = 'E-mail já cadastrado.';
const DUPLICATE_KEY_ERROR_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface TextPattern {
  $regex: string;
  $options: 'i';
}

interface UserFilter {
  role?: Role;
  $or?: [{ name: TextPattern }, { email: TextPattern }];
}

// RF-16: search matches name or e-mail, case-insensitively.
function buildListFilter({ search, role }: UserListOptions): UserFilter {
  const filter: UserFilter = {};
  if (role) filter.role = role;
  if (search) {
    const pattern: TextPattern = { $regex: escapeRegExp(search), $options: 'i' };
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  return filter;
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

  async list(options: UserListOptions): Promise<{ items: PublicUser[]; total: number }> {
    const filter = buildListFilter(options);
    const [documents, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(options.skip)
        .limit(options.limit),
      this.userModel.countDocuments(filter),
    ]);
    return { items: documents.map(toPublicUser), total };
  }

  async update(userId: string, changes: UserChanges): Promise<PublicUser | null> {
    if (!isValidObjectId(userId)) return null;
    try {
      const document = await this.userModel.findByIdAndUpdate(
        userId,
        { $set: changes },
        { new: true, runValidators: true },
      );
      return document ? toPublicUser(document) : null;
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
      throw error;
    }
  }
}
