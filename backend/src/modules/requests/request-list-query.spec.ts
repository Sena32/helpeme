import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { buildRequestFilter, buildRequestSort, escapeRegExp } from './request-list-query';

describe('buildRequestSort', () => {
  it('AC-17: sorts by priority desc, then newest first by default', () => {
    expect(buildRequestSort({})).toEqual({ priorityRank: -1, createdAt: -1, _id: -1 });
  });

  it('AC-18: sorts by createdAt asc with a stable tiebreaker', () => {
    expect(buildRequestSort({ sortBy: 'createdAt', order: 'asc' })).toEqual({
      createdAt: 1,
      _id: 1,
    });
  });

  it('keeps newest first as the tiebreaker when priority is ascending', () => {
    expect(buildRequestSort({ sortBy: 'priority', order: 'asc' })).toEqual({
      priorityRank: 1,
      createdAt: -1,
      _id: -1,
    });
  });
});

describe('buildRequestFilter', () => {
  it('RN-10: scopes a regular user to their own requests', () => {
    expect(buildRequestFilter({}, { ownerId: '64b7f0c2a1b2c3d4e5f60718' })).toEqual({
      createdBy: '64b7f0c2a1b2c3d4e5f60718',
    });
  });

  it('combines status, category, priority and escaped title search', () => {
    expect(
      buildRequestFilter(
        {
          status: RequestStatus.Open,
          categoryId: '64b7f0c2a1b2c3d4e5f60719',
          priority: Priority.High,
          search: 'rede (2º',
        },
        {},
      ),
    ).toEqual({
      status: RequestStatus.Open,
      category: '64b7f0c2a1b2c3d4e5f60719',
      priority: Priority.High,
      title: { $regex: 'rede \\(2º', $options: 'i' },
    });
  });

  it('maps priority UNSET to unclassified requests', () => {
    expect(buildRequestFilter({ priority: 'UNSET' }, {})).toEqual({ priority: null });
  });
});

describe('escapeRegExp', () => {
  it('escapes every regex metacharacter', () => {
    expect(escapeRegExp('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });
});
