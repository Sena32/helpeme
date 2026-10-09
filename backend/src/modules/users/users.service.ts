import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { Env } from '../../config/env.schema';
import { isStrongPassword, WEAK_PASSWORD_MESSAGE } from './password-policy';
import { EMAIL_ALREADY_REGISTERED_MESSAGE, UsersRepository } from './users.repository';
import { CreateUserInput, PublicUser, UserCredentials } from './users.types';

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
}
