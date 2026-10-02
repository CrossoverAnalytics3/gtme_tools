// Detects the claude.ai artifact viewer and lazily resolves its capabilities.
// Outside the viewer (repo, GitHub Pages) every capability is null and the
// tools fall back to plain browser behavior.

export function isHosted() {
  return typeof window !== 'undefined' && typeof window.claude?.use === 'function';
}

const cache = {};
export function capability(name) {
  if (!isHosted()) return Promise.resolve(null);
  cache[name] ??= window.claude.use(name).catch(() => null);
  return cache[name];
}
