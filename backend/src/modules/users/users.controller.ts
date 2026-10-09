import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { PublicUser } from './users.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Post()
  async create(@Body() body: CreateUserDto): Promise<{ user: PublicUser }> {
    return { user: await this.usersService.create(body) };
  }
}
