import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { CLOCK, systemClock } from '../../common/clock';
import { Env } from '../../config/env.schema';
import { CategoriesModule } from '../categories/categories.module';
import { ATTACHMENT_STORAGE } from './attachments/attachment-storage';
import { AttachmentsService } from './attachments/attachments.service';
import { DiskAttachmentStorage } from './attachments/disk-attachment-storage';
import { RequestsController } from './requests.controller';
import { RequestsRepository } from './requests.repository';
import { RequestsService } from './requests.service';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.model';

const BYTES_PER_MEGABYTE = 1024 * 1024;

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServiceRequest.name, schema: ServiceRequestSchema }]),
    // No storage/dest: Multer keeps files in memory until all pass signature validation.
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        limits: {
          fileSize: config.get('MAX_UPLOAD_SIZE_MB', { infer: true }) * BYTES_PER_MEGABYTE,
          files: config.get('MAX_FILES_PER_REQUEST', { infer: true }),
        },
      }),
    }),
    CategoriesModule,
  ],
  controllers: [RequestsController],
  exports: [RequestsService],
  providers: [
    RequestsRepository,
    RequestsService,
    AttachmentsService,
    { provide: CLOCK, useValue: systemClock },
    {
      provide: ATTACHMENT_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new DiskAttachmentStorage(config.get('UPLOAD_DIR', { infer: true })),
    },
  ],
})
export class RequestsModule {}
