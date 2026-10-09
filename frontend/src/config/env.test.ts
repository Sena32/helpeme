import { parseEnv } from './env';

describe('parseEnv', () => {
  it('reads the API base URL', () => {
    expect(parseEnv({ VITE_API_BASE_URL: '/api' }).apiBaseUrl).toBe('/api');
  });

  it('fails fast when the API base URL is missing', () => {
    expect(() => parseEnv({})).toThrow(/VITE_API_BASE_URL/);
  });
});
