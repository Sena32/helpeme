import { parseUserListQuery, toUserSearchParams } from './user-list-query';

describe('user list query <-> URL (UI-05)', () => {
  it('starts on page 1 with 10 users and no filters', () => {
    expect(parseUserListQuery(new URLSearchParams())).toEqual({ page: 1, limit: 10 });
  });

  it('reads page, search and role from the URL', () => {
    expect(parseUserListQuery(new URLSearchParams('page=2&search=%20ana%20&role=ADMIN'))).toEqual({
      page: 2,
      limit: 10,
      search: 'ana',
      role: 'ADMIN',
    });
  });

  it('ignores invalid or tampered values', () => {
    expect(parseUserListQuery(new URLSearchParams('page=-1&role=ROOT&search=%20'))).toEqual({
      page: 1,
      limit: 10,
    });
  });

  it('writes only meaningful values back to the URL', () => {
    expect(toUserSearchParams({ page: 1, limit: 10, role: 'USER' }).toString()).toBe('role=USER');
    expect(toUserSearchParams({ page: 3, limit: 10, search: 'ana' }).toString()).toBe(
      'page=3&search=ana',
    );
  });
});
