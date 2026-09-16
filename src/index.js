export const PROTOCOL_VERSION = '1';
export const DISCOVERY_PATH = '/.well-known/nexia-developer-platform';

const appIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*)+(?![\s\S])/;
const screenIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![\s\S])/;
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?(?![\s\S])/;
const routePattern = /^\/(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?(?![\s\S])/;
const entryPattern = /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+(?![\s\S])/;

/** Validate the deliberately small, remote UI manifest; never mutate input. */
export function validateManifest(value) {
  const errors = [];
  const fail = (path, message) => errors.push({ path, message });
  const object = (item, path, keys, required = keys) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      fail(path, 'Must be an object.');
      return false;
    }
    for (const key of Object.keys(item)) if (!keys.includes(key)) fail(`${path}.${key}`, 'Unsupported field.');
    for (const key of required) if (!Object.hasOwn(item, key)) fail(`${path}.${key}`, 'Required field.');
    return true;
  };
  const string = (item, path, pattern, message) => {
    if (typeof item !== 'string' || !item.trim()) fail(path, 'Must be a nonempty string.');
    else if (pattern && !pattern.test(item)) fail(path, message);
  };
  if (!object(value, '$', ['schema_version', 'app', 'screens', 'permissions'], ['schema_version', 'app', 'screens'])) return { valid: false, errors };
  if (value.schema_version !== PROTOCOL_VERSION) fail('$.schema_version', 'Only schema version "1" is supported.');
  if (object(value.app, '$.app', ['id', 'name', 'version'])) {
    string(value.app.id, '$.app.id', appIdPattern, 'Use a lowercase reverse-domain identifier, such as com.example.notes.');
    string(value.app.name, '$.app.name');
    string(value.app.version, '$.app.version', semverPattern, 'Must be a semantic version, such as 0.1.0.');
  }
  if (!Array.isArray(value.screens) || !value.screens.length) fail('$.screens', 'Must contain at least one screen.');
  else {
    const ids = new Set();
    const routes = new Set();
    value.screens.forEach((screen, index) => {
      const path = `$.screens[${index}]`;
      if (!object(screen, path, ['id', 'route', 'entry'])) return;
      string(screen.id, `${path}.id`, screenIdPattern, 'Use a lowercase hyphen-separated identifier.');
      string(screen.route, `${path}.route`, routePattern, 'Use an absolute local route with literal path segments and no trailing slash, such as /notes.');
      string(screen.entry, `${path}.entry`, entryPattern, 'Use a relative source file path with an extension and no traversal, such as src/screens/notes.tsx.');
      if (typeof screen.id === 'string') {
        if (ids.has(screen.id)) fail(`${path}.id`, 'Screen identifiers must be unique.');
        ids.add(screen.id);
      }
      if (typeof screen.route === 'string') {
        if (routes.has(screen.route)) fail(`${path}.route`, 'Screen routes must be unique.');
        routes.add(screen.route);
      }
    });
  }
  if (Object.hasOwn(value, 'permissions') && object(value.permissions, '$.permissions', ['required'])) {
    const required = value.permissions.required;
    if (!Array.isArray(required)) fail('$.permissions.required', 'Must be an array of permission keys.');
    else {
      const seen = new Set();
      required.forEach((key, index) => {
        const path = `$.permissions.required[${index}]`;
        string(key, path, /^\S+(?![\s\S])/, 'Permission keys cannot contain whitespace.');
        if (seen.has(key)) fail(path, 'Permission keys must be unique.');
        seen.add(key);
      });
    }
  }
  return { valid: errors.length === 0, errors };
}
