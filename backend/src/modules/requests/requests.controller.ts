import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsService } from './requests.service';
import { RequestDetails } from './requests.types';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // API-08 is multipart; file upload arrives in T-10, until then only text fields are parsed.
  @Post()
  @UseInterceptors(NoFilesInterceptor())
  async create(
    @Body() body: CreateRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ request: RequestDetails }> {
    return { request: await this.requestsService.create(body, user.id) };
  }
}
