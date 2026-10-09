import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UploadedImage } from './attachments/attachments.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsService } from './requests.service';
import { RequestDetails } from './requests.types';

export const ATTACHMENTS_FIELD = 'files';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // Size and count limits come from MulterModule (MAX_UPLOAD_SIZE_MB, MAX_FILES_PER_REQUEST).
  @Post()
  @UseInterceptors(FilesInterceptor(ATTACHMENTS_FIELD))
  async create(
    @Body() body: CreateRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: UploadedImage[] | undefined,
  ): Promise<{ request: RequestDetails }> {
    return { request: await this.requestsService.create(body, user.id, files ?? []) };
  }

  @Get(':requestId/attachments/:attachmentId')
  async downloadAttachment(
    @Param('requestId') requestId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { attachment, stream } = await this.requestsService.openAttachment(
      requestId,
      attachmentId,
      user,
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(stream, {
      type: attachment.mimeType,
      length: attachment.sizeBytes,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
    });
  }
}
