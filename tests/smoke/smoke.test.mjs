// End-to-end smoke against the running Docker stack, through nginx (RNF-07).
// Run with: scripts/smoke.sh  (or SMOKE_BASE_URL=http://localhost:8080 node --test tests/smoke/smoke.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

function readDotEnv() {
  const content = readFileSync(`${repoRoot}.env`, 'utf8');
  return Object.fromEntries(
    content
      .split('\n')
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  );
}

const env = readDotEnv();
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://localhost:${env.FRONTEND_PORT}`;
const runId = Date.now();
const PASSWORD = 'Smoke123@';
const PNG_BYTES = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(120, 1)]);

class Session {
  cookie = '';

  async request(path, { method = 'GET', json, form } = {}) {
    const headers = this.cookie ? { Cookie: this.cookie } : {};
    if (json) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: json ? JSON.stringify(json) : form,
      redirect: 'manual',
    });
    const accessCookie = response.headers.getSetCookie().find((cookie) => cookie.startsWith('access_token='));
    if (accessCookie) this.cookie = accessCookie.split(';')[0];
    const type = response.headers.get('content-type') ?? '';
    const body = type.includes('application/json') ? await response.json() : await response.arrayBuffer();
    return { status: response.status, type, body, headers: response.headers };
  }
}

async function login(email, password) {
  const session = new Session();
  const response = await session.request('/api/auth/login', { method: 'POST', json: { email, password } });
  assert.equal(response.status, 200, `login ${email}: ${JSON.stringify(response.body)}`);
  return session;
}

async function registerUser(label) {
  const session = new Session();
  const email = `smoke-${label}-${runId}@example.com`;
  const response = await session.request('/api/auth/register', {
    method: 'POST',
    json: { name: `Smoke ${label}`, email, password: PASSWORD, role: 'ADMIN' },
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.equal(response.body.user.role, 'USER', 'public sign-up must never create ADMIN (RN-03)');
  return session;
}

test('frontend is served by nginx with SPA fallback', async () => {
  for (const path of ['/', '/admin/solicitacoes/qualquer']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /<title>HelpeMe<\/title>/);
  }
});

test('API is proxied and healthy, with request ids', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.ok(response.headers.get('x-request-id'));
});

test('seed runs on boot: admin root, default categories and test user (RF-04)', async () => {
  const admin = await login(env.ADMIN_ROOT_EMAIL, env.ADMIN_ROOT_PASSWORD);
  const categories = await admin.request('/api/categories');
  const names = categories.body.map((category) => category.name);
  for (const name of ['Infra', 'Desenvolvimento', 'RH', 'Suporte Técnico', 'Outros']) {
    assert.ok(names.includes(name), `missing default category ${name}`);
  }
  if (env.SEED_USER_EMAIL) {
    const testUser = await login(env.SEED_USER_EMAIL, env.SEED_USER_PASSWORD);
    assert.equal((await testUser.request('/api/auth/me')).body.user.role, 'USER');
  }
});

test('full request lifecycle: user opens with attachment, admin handles and resolves', async () => {
  const author = await registerUser('author');
  const outsider = await registerUser('outsider');
  const admin = await login(env.ADMIN_ROOT_EMAIL, env.ADMIN_ROOT_PASSWORD);
  const categoryId = (await author.request('/api/categories')).body[0].id;

  const form = new FormData();
  form.append('title', `Smoke ${runId}`);
  form.append('categoryId', categoryId);
  form.append('description', 'Solicitação criada pelo smoke test ponta a ponta para validar o fluxo completo.');
  form.append('files', new File([PNG_BYTES], 'tela.png', { type: 'image/png' }));
  const created = await author.request('/api/requests', { method: 'POST', form });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const { id, attachments } = created.body.request;
  assert.equal(created.body.request.status, 'OPEN');
  assert.equal(attachments[0].originalName, 'tela.png');

  const download = await author.request(`/api/requests/${id}/attachments/${attachments[0].id}`);
  assert.equal(download.status, 200);
  assert.equal(download.type, 'image/png');
  assert.equal(Buffer.compare(Buffer.from(download.body), PNG_BYTES), 0);

  assert.equal((await outsider.request(`/api/requests/${id}`)).status, 404, 'AC-15');
  assert.equal((await outsider.request(`/api/requests/${id}/attachments/${attachments[0].id}`)).status, 404, 'AC-30');
  assert.equal((await author.request(`/api/requests/${id}`, { method: 'PATCH', json: { priority: 'HIGH' } })).status, 403, 'AC-16');

  const adminList = await admin.request(`/api/requests?search=${encodeURIComponent(`Smoke ${runId}`)}`);
  assert.equal(adminList.body.items[0]?.createdBy?.name, 'Smoke author');

  const handled = await admin.request(`/api/requests/${id}`, {
    method: 'PATCH',
    json: { priority: 'HIGH', status: 'IN_PROGRESS', adminNote: 'Em análise pelo smoke.' },
  });
  assert.equal(handled.status, 200, JSON.stringify(handled.body));
  const resolved = await admin.request(`/api/requests/${id}`, {
    method: 'PATCH',
    json: { status: 'RESOLVED', resolution: 'Resolvido pelo smoke.' },
  });
  assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
  assert.equal((await admin.request(`/api/requests/${id}`, { method: 'PATCH', json: { status: 'IN_PROGRESS' } })).status, 409, 'AC-23');

  const seenByAuthor = (await author.request(`/api/requests/${id}`)).body.request;
  assert.equal(seenByAuthor.status, 'RESOLVED');
  assert.equal(seenByAuthor.priority, 'HIGH');
  assert.equal(seenByAuthor.resolution, 'Resolvido pelo smoke.');
  assert.ok(seenByAuthor.resolvedAt);

  const summary = (await author.request('/api/dashboard/summary')).body;
  assert.deepEqual([summary.total, summary.byStatus.RESOLVED], [1, 1], 'AC-26');
});

test('logout ends the session (API-03)', async () => {
  const session = await registerUser('logout');
  assert.equal((await session.request('/api/auth/logout', { method: 'POST' })).status, 204);
  session.cookie = '';
  assert.equal((await session.request('/api/auth/me')).status, 401);
});
