import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const readRepoFile = (relativePath) => readFileSync(`${repoRoot}${relativePath}`, 'utf8');

const ENV_GROUP_PATTERN = /^(Backend|Frontend|Mongo): (.+)$/gm;
const ENV_NAME_PATTERN = /[A-Z][A-Z0-9_]+/g;
const COMPOSE_VARIABLE_PATTERN = /\$\{([A-Z0-9_]+)\}/g;

const declaredEnvNames = () =>
  new Set([...readRepoFile('.env.example').matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]));

const specEnvNames = () =>
  [...readRepoFile('docs/specs/03-architecture.md').matchAll(ENV_GROUP_PATTERN)].flatMap(
    (match) => match[2].match(ENV_NAME_PATTERN) ?? [],
  );

const isGitIgnored = (relativePath) => {
  try {
    execFileSync('git', ['check-ignore', '-q', relativePath], { cwd: repoRoot });
    return true;
  } catch {
    return false;
  }
};

test('.env.example declares every variable listed in SPEC-03', () => {
  const declared = declaredEnvNames();
  const expected = specEnvNames();

  assert.ok(expected.length > 0, 'SPEC-03 env list not found');
  assert.deepEqual(expected.filter((name) => !declared.has(name)), []);
});

test('docker-compose.yml only references variables declared in .env.example', () => {
  const declared = declaredEnvNames();
  const referenced = [...readRepoFile('docker-compose.yml').matchAll(COMPOSE_VARIABLE_PATTERN)].map(
    (match) => match[1],
  );

  assert.deepEqual(referenced.filter((name) => !declared.has(name)), []);
});

test('docker-compose.yml defines SPEC-03 services and named volumes', () => {
  const compose = readRepoFile('docker-compose.yml');

  for (const service of ['mongo', 'backend', 'frontend']) {
    assert.match(compose, new RegExp(`^  ${service}:$`, 'm'));
  }
  for (const volume of ['mongo-data', 'uploads-data']) {
    assert.match(compose, new RegExp(`^  ${volume}:$`, 'm'));
  }
});

test('.gitignore keeps secrets and generated files out of Git', () => {
  const mustBeIgnored = ['.env', '.env.local', 'backend/node_modules/x', 'backend/dist/x', 'uploads/x', 'coverage/x'];

  assert.deepEqual(mustBeIgnored.filter((path) => !isGitIgnored(path)), []);
  assert.equal(isGitIgnored('.env.example'), false);
});

const APPS = ['backend', 'frontend'];

const composeServiceBlock = (serviceName) => {
  const compose = readRepoFile('docker-compose.yml');
  const start = compose.indexOf(`\n  ${serviceName}:\n`);
  const nextBlock = compose.slice(start + 1).search(/\n {2}[a-z-]+:\n|\n[a-z]+:\n/);
  return compose.slice(start, nextBlock === -1 ? undefined : start + 1 + nextBlock);
};

for (const app of APPS) {
  test(`${app} Dockerfile is multi-stage and runs as a non-root user`, () => {
    const dockerfile = readRepoFile(`${app}/Dockerfile`);

    assert.ok((dockerfile.match(/^FROM /gm) ?? []).length >= 2, 'expected build and runtime stages');
    assert.match(dockerfile, /^USER (?!root)\S+/m);
  });

  test(`${app} .dockerignore keeps secrets and local artifacts out of the image`, () => {
    const ignored = readRepoFile(`${app}/.dockerignore`).split('\n').map((line) => line.trim());

    for (const entry of ['node_modules', 'dist', '.env', 'coverage']) {
      assert.ok(ignored.includes(entry), `${entry} missing`);
    }
  });
}

test('backend service has a healthcheck and frontend waits for it to be healthy', () => {
  assert.match(composeServiceBlock('backend'), /healthcheck:/);
  assert.match(composeServiceBlock('frontend'), /backend:\s*\n\s*condition: service_healthy/);
});

test('only the backend receives the full .env (secrets stay out of mongo and nginx)', () => {
  assert.match(composeServiceBlock('backend'), /env_file: \.env/);
  assert.doesNotMatch(composeServiceBlock('mongo'), /env_file/);
  assert.doesNotMatch(composeServiceBlock('frontend'), /env_file/);
});

test('nginx proxies /api to the backend and falls back to the SPA', () => {
  const nginxTemplate = readRepoFile('frontend/nginx/default.conf.template');

  assert.match(nginxTemplate, /location \/api\/ \{[^}]*proxy_pass http:\/\/backend:\$\{BACKEND_PORT\};/);
  assert.match(nginxTemplate, /try_files \$uri \$uri\/ \/index\.html;/);
});
