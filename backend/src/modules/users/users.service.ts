import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { Env } from '../../config/env.schema';
import { isStrongPassword, WEAK_PASSWORD_MESSAGE } from './password-policy';
import { EMAIL_ALREADY_REGISTERED_MESSAGE, UsersRepository } from './users.repository';
import {
  CreateUserInput,
  ListUsersQuery,
  PublicUser,
  UserChanges,
  UserCredentials,
  UserListPage,
} from './users.types';

export const USER_NOT_FOUND_MESSAGE = 'Usuário não encontrado.';
export const EMPTY_USER_CHANGES_MESSAGE = 'Informe ao menos um campo para alterar.';
export const OWN_ROLE_CHANGE_MESSAGE = 'Você não pode alterar o seu próprio perfil.';
const FIRST_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function normalizeChanges({ name, email, role }: UserChanges): UserChanges {
  const changes: UserChanges = {};
  if (name !== undefined) changes.name = name.trim();
  if (email !== undefined) changes.email = email.trim().toLowerCase();
  if (role !== undefined) changes.role = role;
  return changes;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(input: CreateUserInput): Promise<PublicUser> {
    if (!isStrongPassword(input.password)) throw new BadRequestException(WEAK_PASSWORD_MESSAGE);

    const email = input.email.trim().toLowerCase();
    if (await this.usersRepository.existsByEmail(email)) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
    }

    const passwordHash = await hash(
      input.password,
      this.config.get('BCRYPT_ROUNDS', { infer: true }),
    );
    return this.usersRepository.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role ?? Role.User,
    });
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.usersRepository.findCredentialsByEmail(email);
  }

  findById(id: string): Promise<PublicUser | null> {
    return this.usersRepository.findById(id);
  }

  // RF-16: newest first, page size capped by PAGINATION_MAX_LIMIT (RNF-06).
  async list(query: ListUsersQuery): Promise<UserListPage> {
    const page = query.page ?? FIRST_PAGE;
    const limit = Math.min(
      query.limit ?? DEFAULT_PAGE_SIZE,
      this.config.get('PAGINATION_MAX_LIMIT', { infer: true }),
    );
    const { items, total } = await this.usersRepository.list({
      skip: (page - 1) * limit,
      limit,
      search: query.search,
      role: query.role,
    });
    return { items, total, page, limit };
  }

  // RF-17 / RN-14: an admin demoting themselves could lock everyone out of administration.
  async update(userId: string, input: UserChanges, actor: AuthenticatedUser): Promise<PublicUser> {
    const changes = normalizeChanges(input);
    if (Object.keys(changes).length === 0)
      throw new BadRequestException(EMPTY_USER_CHANGES_MESSAGE);

    const current = await this.usersRepository.findById(userId);
    if (!current) throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    if (current.id === actor.id && changes.role && changes.role !== current.role) {
      throw new ConflictException(OWN_ROLE_CHANGE_MESSAGE);
    }

    const updated = await this.usersRepository.update(userId, changes);
    if (!updated) throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    return updated;
  }
}
