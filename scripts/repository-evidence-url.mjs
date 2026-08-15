const absoluteSchemePattern = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export function parseRepositoryEvidenceUrl(url, { baseUrl, repositoryBlobPrefix }) {
  const repositoryBlobUrl = new URL(repositoryBlobPrefix);
  const repositoryBlobPathPrefix = repositoryBlobUrl.pathname;
  const relativeReference = !absoluteSchemePattern.test(url) && !url.startsWith('//');
  const rawRepositoryReference = url.startsWith(repositoryBlobPrefix);

  let parsed;
  try {
    parsed = new URL(url, baseUrl);
  } catch {
    return { error: 'malformed-url' };
  }

  const repositoryOrigin = parsed.origin === repositoryBlobUrl.origin;
  const withinRepositoryPath = parsed.pathname.startsWith(repositoryBlobPathPrefix);

  if ((relativeReference || rawRepositoryReference) && (!repositoryOrigin || !withinRepositoryPath)) {
    return { error: 'path-escape' };
  }

  if (!repositoryOrigin || !withinRepositoryPath) {
    return { external: true };
  }

  try {
    return {
      repositoryPath: decodeURIComponent(parsed.pathname.slice(repositoryBlobPathPrefix.length)),
    };
  } catch {
    return { error: 'malformed-path' };
  }
}
