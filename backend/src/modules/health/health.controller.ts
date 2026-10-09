import { Controller, Get } from '@nestjs/common';

export const HEALTHY_STATUS = 'ok';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: typeof HEALTHY_STATUS } {
    return { status: HEALTHY_STATUS };
  }
}
