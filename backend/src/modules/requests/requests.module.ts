import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from '../categories/categories.module';
import { RequestsController } from './requests.controller';
import { RequestsRepository } from './requests.repository';
import { RequestsService } from './requests.service';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServiceRequest.name, schema: ServiceRequestSchema }]),
    CategoriesModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsRepository, RequestsService],
})
export class RequestsModule {}
