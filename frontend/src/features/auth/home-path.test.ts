import { homePathFor } from './home-path';

describe('homePathFor', () => {
  it('sends admins to /admin and users to /', () => {
    expect(homePathFor('ADMIN')).toBe('/admin');
    expect(homePathFor('USER')).toBe('/');
  });
});
