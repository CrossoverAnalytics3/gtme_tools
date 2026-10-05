// Where pages link to. In the repo (GitHub Pages, npm start) every page is a
// relative file. The hosted build (scripts/build-hosted.js) rewrites
// HOSTED_LINKS with each page's claude.ai artifact URL.
export const HOSTED_LINKS = null;

const REPO_DESIGN_SYSTEM = 'https://github.com/CrossoverAnalytics3/gtme_tools/tree/HEAD/design-system/project';

export function hubHref(base) {
  return HOSTED_LINKS?.hub ?? `${base}/index.html`;
}

export function toolHref(id, base) {
  return HOSTED_LINKS?.[id] ?? `${base}/tools/${id}.html`;
}

export function designSystemHref(base) {
  return HOSTED_LINKS?.designSystem ?? REPO_DESIGN_SYSTEM;
}
