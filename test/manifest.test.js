import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManifest } from '../src/index.js';
const manifest = () => ({ schema_version: '1', app: { id: 'com.example.notes', name: 'Notes', version: '0.1.0-alpha.0' }, screens: [{ id: 'notes', route: '/notes', entry: 'src/notes.tsx' }] });

test('accepts a minimal UI declaration without modifying it', () => {
  const value = manifest();
  const before = structuredClone(value);
  assert.deepEqual(validateManifest(value), { valid: true, errors: [] });
  assert.deepEqual(value, before);
});
test('unsupported backend declarations cannot silently pass', () => {
  const value = { ...manifest(), functions: [{ id: 'send-email' }] };
  assert.equal(validateManifest(value).valid, false);
  assert.ok(validateManifest(value).errors.some(({ path }) => path === '$.functions'));
});
test('rejects paths that escape the project or target remote addresses', () => {
  for (const entry of ['../secret.ts', '/tmp/entry.ts', 'src/../../secret.ts', 'https://host/app.js', 'src\\entry.ts', 'src/%2e%2e/secret.ts']) {
    const value = manifest();
    value.screens[0].entry = entry;
    assert.equal(validateManifest(value).valid, false, entry);
  }
});
test('rejects ambiguous routes and duplicate screen identities', () => {
  for (const route of ['//evil.test', '/notes?user=1', '/notes/../admin', '/notes/', 'notes']) {
    const value = manifest();
    value.screens[0].route = route;
    assert.equal(validateManifest(value).valid, false, route);
  }
  const value = manifest();
  value.screens.push({ ...value.screens[0] });
  const errors = validateManifest(value).errors;
  assert.ok(errors.some(({ path }) => path === '$.screens[1].id'));
  assert.ok(errors.some(({ path }) => path === '$.screens[1].route'));
});
test('enforces semantic version and rejects wrong shapes', () => {
  for (const value of [null, [], {}, { ...manifest(), schema_version: 1 }, { ...manifest(), screens: [] }]) assert.equal(validateManifest(value).valid, false);
  for (const version of ['1', 'v1.0.0', '01.0.0', '1.0.0-01']) {
    const value = manifest(); value.app.version = version;
    assert.equal(validateManifest(value).valid, false, version);
  }
});
test('permission declarations are unique strings, not grants', () => {
  assert.equal(validateManifest({ ...manifest(), permissions: { required: ['notes.read'] } }).valid, true);
  for (const required of [['notes.read', 'notes.read'], [''], ['notes read'], [1], 'notes.read']) {
    assert.equal(validateManifest({ ...manifest(), permissions: { required } }).valid, false);
  }
});
test('identifiers and paths cannot hide trailing line terminators', () => {
  for (const ending of ['\n', '\r', '\u2028', '\u2029']) {
    for (const key of ['id', 'route', 'entry']) {
      const value = manifest();
      value.screens[0][key] += ending;
      assert.equal(validateManifest(value).valid, false, `${key} ${JSON.stringify(ending)}`);
    }
    const value = manifest();
    value.app.version += ending;
    assert.equal(validateManifest(value).valid, false);
    assert.equal(validateManifest({ ...manifest(), permissions: { required: [`notes.read${ending}`] } }).valid, false);
  }
});
