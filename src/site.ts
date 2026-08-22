export const site = {
  name: 'coding agent tips',
  repository: 'https://github.com/anipotts/coding-agent-tips',
  repositoryStars: 27,
  repositoryStarsVerified: '2026-08-11',
  releaseHistory: 'https://github.com/anipotts/coding-agent-tips/releases',
  interfaceCopy: {
    menu: 'menu',
    search: 'search',
    sources: 'sources',
    evidence: 'evidence',
    github: 'coding agent tips on GitHub',
    home: 'coding agent tips home',
    legacyPolicy: 'legacy policy',
    releases: 'releases',
    verified: 'verified',
  },
} as const;

export const navigationGroups = [
  { id: 'guides', label: 'product guides', order: 10 },
  { id: 'practice', label: 'practice', order: 20 },
  { id: 'decision', label: 'choosing a setup', order: 30 },
  { id: 'evidence', label: 'verification', order: 40 },
  { id: 'legacy', label: 'legacy', order: 90 },
] as const;

export type NavigationGroup = (typeof navigationGroups)[number]['id'];
