import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from './dashboard.types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummary> {
    return this.dashboardService.summarize(user);
  }
}
