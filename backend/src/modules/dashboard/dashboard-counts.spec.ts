import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { toPriorityCounts, toStatusCounts } from './dashboard-counts';

describe('dashboard count mappers', () => {
  it('zero-fills every status', () => {
    expect(toStatusCounts([{ _id: RequestStatus.Open, count: 2 }])).toEqual({
      OPEN: 2,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    });
  });

  it('maps null priority to UNSET and zero-fills the rest', () => {
    expect(
      toPriorityCounts([
        { _id: null, count: 3 },
        { _id: Priority.High, count: 1 },
      ]),
    ).toEqual({ HIGH: 1, MEDIUM: 0, LOW: 0, UNSET: 3 });
  });
});
