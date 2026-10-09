import { Injectable } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequestsService } from '../requests/requests.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardSummary } from './dashboard.types';

export const RECENT_REQUESTS_COUNT = 5;

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly requestsService: RequestsService,
  ) {}

  // AC-26/27: users see only their own numbers; admins see global ones.
  async summarize(viewer: AuthenticatedUser): Promise<DashboardSummary> {
    const ownerId = viewer.role === Role.Admin ? undefined : viewer.id;
    const [counts, recentPage] = await Promise.all([
      this.dashboardRepository.countRequests({ ownerId }),
      this.requestsService.list(
        { sortBy: 'createdAt', order: 'desc', limit: RECENT_REQUESTS_COUNT },
        viewer,
      ),
    ]);
    return { ...counts, recent: recentPage.items };
  }
}
