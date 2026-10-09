import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

export const HEALTHY_STATUS = 'ok';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: typeof HEALTHY_STATUS } {
    return { status: HEALTHY_STATUS };
  }
}
