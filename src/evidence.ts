import registry from '../docs/sources.json';

export const evidenceLabels = registry.evidence_labels;
export type EvidenceStatus = keyof typeof evidenceLabels;
