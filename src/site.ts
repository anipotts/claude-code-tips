export const site = {
  name: 'coding agent tips',
  repository: 'https://github.com/anipotts/coding-agent-tips',
  repositoryStars: 28,
  repositoryStarsVerified: '2026-08-22',
  releaseHistory: 'https://github.com/anipotts/coding-agent-tips/releases',
  interfaceCopy: {
    menu: 'menu',
    search: 'search',
    sources: 'sources',
    evidence: 'examples and sources',
    github: 'coding agent tips on GitHub',
    home: 'coding agent tips home',
    archive: 'archive',
    lastUpdated: 'last updated',
    releases: 'releases',
  },
} as const;

export const navigationScopes = [
  { id: 'general', label: 'general', href: '/', order: 10 },
  { id: 'codex', label: 'codex', href: '/guides/codex/', order: 20 },
  { id: 'claude-code', label: 'claude code', href: '/guides/claude-code/', order: 30 },
  { id: 'grok', label: 'grok', href: '/guides/grok/', order: 40 },
] as const;

export type NavigationScope = (typeof navigationScopes)[number]['id'];

export function scopeForPath(pathname: string): NavigationScope {
  if (pathname.startsWith('/guides/codex/')) return 'codex';
  if (pathname.startsWith('/guides/claude-code/')) return 'claude-code';
  if (pathname.startsWith('/guides/grok/')) return 'grok';
  return 'general';
}
