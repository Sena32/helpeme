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
