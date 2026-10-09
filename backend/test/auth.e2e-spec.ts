import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './create-test-app';

const ACCESS_TOKEN_COOKIE = 'access_token';
const validRegistration = {
  name: 'Maria Silva',
  email: 'maria@example.com',
  password: 'Senha123@',
};

const userOf = (response: Response) => (response.body as { user: Record<string, unknown> }).user;
const messageOf = (response: Response) => (response.body as { message: unknown }).message;

function findAccessTokenCookie(setCookieHeader: string[] | string | undefined): string | undefined {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ''];
  return cookies.find((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
}

describe('Auth (API-01..04)', () => {
  let app: INestApplication<App>;
  let emailSequence = 0;

  const uniqueEmail = () => `user${(emailSequence += 1)}@example.com`;
  const register = (body: object) =>
    request(app.getHttpServer()).post('/api/auth/register').send(body);
  const login = (body: object) => request(app.getHttpServer()).post('/api/auth/login').send(body);

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('AC-01: creates a USER and authenticates with an httpOnly cookie', async () => {
      const response = await register({ ...validRegistration, email: uniqueEmail() });

      expect(response.status).toBe(201);
      expect(userOf(response)).toMatchObject({ name: 'Maria Silva', role: 'USER' });
      expect(userOf(response)).not.toHaveProperty('passwordHash');
      expect(findAccessTokenCookie(response.headers['set-cookie'])).toMatch(/HttpOnly/i);
    });

    it('AC-02: rejects an existing email in any letter case with 409', async () => {
      const email = uniqueEmail();
      await register({ ...validRegistration, email });

      const response = await register({ ...validRegistration, email: email.toUpperCase() });

      expect(response.status).toBe(409);
    });

    it('AC-03: rejects password "abc123" with 400', async () => {
      const response = await register({
        ...validRegistration,
        email: uniqueEmail(),
        password: 'abc123',
      });

      expect(response.status).toBe(400);
    });

    it('AC-04: ignores role ADMIN in the public registration body', async () => {
      const response = await register({
        ...validRegistration,
        email: uniqueEmail(),
        role: 'ADMIN',
      });

      expect(response.status).toBe(201);
      expect(userOf(response).role).toBe('USER');
    });

    it('rejects unknown fields and an invalid email with 400', async () => {
      const unknownField = await register({ ...validRegistration, email: uniqueEmail(), age: 3 });
      const invalidEmail = await register({ ...validRegistration, email: 'not-an-email' });

      expect(unknownField.status).toBe(400);
      expect(invalidEmail.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const email = 'login@example.com';

    beforeAll(async () => {
      await register({ ...validRegistration, email });
    });

    it('AC-05: returns 200 with an httpOnly SameSite=Lax cookie for valid credentials', async () => {
      const response = await login({
        email: 'LOGIN@example.com',
        password: validRegistration.password,
      });

      expect(response.status).toBe(200);
      expect(userOf(response)).toMatchObject({ email, role: 'USER' });
      const cookie = findAccessTokenCookie(response.headers['set-cookie']);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
    });

    it('AC-06: answers wrong password and unknown email with the same generic 401', async () => {
      const wrongPassword = await login({ email, password: 'Errada123@' });
      const unknownEmail = await login({ email: 'ghost@example.com', password: 'Errada123@' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(messageOf(wrongPassword)).toBe(messageOf(unknownEmail));
      expect(findAccessTokenCookie(wrongPassword.headers['set-cookie'])).toBeUndefined();
    });
  });

  describe('session (API-03, API-04)', () => {
    it('GET /api/auth/me returns the current user from the cookie', async () => {
      const email = uniqueEmail();
      const agent = request.agent(app.getHttpServer());
      await agent.post('/api/auth/register').send({ ...validRegistration, email });

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(userOf(response)).toMatchObject({ email, role: 'USER' });
    });

    it('GET /api/auth/me without a valid cookie returns 401', async () => {
      const missing = await request(app.getHttpServer()).get('/api/auth/me');
      const forged = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', `${ACCESS_TOKEN_COOKIE}=forged.token.value`);

      expect(missing.status).toBe(401);
      expect(forged.status).toBe(401);
    });

    it('POST /api/auth/logout returns 204 and clears the cookie', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/api/auth/register').send({ ...validRegistration, email: uniqueEmail() });

      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(204);
      expect(findAccessTokenCookie(response.headers['set-cookie'])).toMatch(
        /Expires=Thu, 01 Jan 1970/,
      );
      expect((await agent.get('/api/auth/me')).status).toBe(401);
    });

    it('POST /api/auth/logout requires authentication', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});
