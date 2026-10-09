import { DEFAULT_ADMIN_QUERY, parseAdminListQuery, toAdminSearchParams } from './admin-list-query';

describe('admin list query <-> URL', () => {
  it('starts on page 1 with the backend default sort', () => {
    expect(parseAdminListQuery(new URLSearchParams())).toEqual(DEFAULT_ADMIN_QUERY);
    expect(DEFAULT_ADMIN_QUERY).toEqual({ page: 1, limit: 10 });
  });

  it('reads every supported filter from the URL', () => {
    const query = parseAdminListQuery(
      new URLSearchParams(
        'page=3&sortBy=createdAt&order=asc&status=OPEN&categoryId=cat-1&priority=UNSET&search=rede',
      ),
    );

    expect(query).toEqual({
      page: 3,
      limit: 10,
      sortBy: 'createdAt',
      order: 'asc',
      status: 'OPEN',
      categoryId: 'cat-1',
      priority: 'UNSET',
      search: 'rede',
    });
  });

  it('ignores invalid or tampered values', () => {
    expect(
      parseAdminListQuery(
        new URLSearchParams(
          'page=-2&sortBy=title&order=up&status=DONE&priority=URGENT&search=%20%20',
        ),
      ),
    ).toEqual(DEFAULT_ADMIN_QUERY);
  });

  it('writes only non-default values back to the URL', () => {
    expect(
      toAdminSearchParams({ page: 1, limit: 10, status: 'RESOLVED', search: 'rede' }).toString(),
    ).toBe('status=RESOLVED&search=rede');
    expect(toAdminSearchParams({ page: 2, limit: 10 }).toString()).toBe('page=2');
  });
});
