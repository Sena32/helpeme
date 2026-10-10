import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { PublicUser, UserListPage } from './users.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Post()
  async create(@Body() body: CreateUserDto): Promise<{ user: PublicUser }> {
    return { user: await this.usersService.create(body) };
  }

  @Roles(Role.Admin)
  @Get()
  list(@Query() query: ListUsersQueryDto): Promise<UserListPage> {
    return this.usersService.list(query);
  }

  @Roles(Role.Admin)
  @Patch(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ user: PublicUser }> {
    return { user: await this.usersService.update(userId, body, actor) };
  }
}
