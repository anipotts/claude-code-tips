export type ReviewDecision = 'vetted' | 'needs-revision';
export type ReviewStatus = 'needs-review' | 'vetted' | 'changed-since-vetting' | 'needs-revision';
export type ReviewBlockKind = 'frontmatter' | 'heading' | 'paragraph' | 'list' | 'table' | 'code' | 'blockquote' | 'html' | 'interface-copy' | 'evidence-copy';

export type ReviewLedgerEntry = {
  blockKey: string;
  owner: string;
  blockId: string;
  decision: ReviewDecision;
  fingerprint: string;
  reviewedAt: string;
  batchId: string;
};

export type ReviewLedger = {
  version: 1;
  entries: Record<string, ReviewLedgerEntry>;
};

export type ReviewBlock = {
  id: string;
  key: string;
  owner: string;
  kind: ReviewBlockKind;
  label: string;
  headingPath: string[];
  value: string;
  plainText: string;
  rawSource: string;
  fingerprint: string;
  lineStart: number;
  lineEnd: number;
  editable: boolean;
  status: ReviewStatus;
  decision: ReviewDecision | null;
};

export type ReviewSurface = {
  id: string;
  route: string | null;
  owner: string;
  title: string;
  description: string;
  group: 'homepage' | 'shared' | 'codex' | 'claude-code' | 'grok' | 'field-lab' | 'archive';
  order: number;
  frozen: boolean;
  counts: Record<ReviewStatus, number>;
};

export type ReviewDocument = ReviewSurface & {
  fileFingerprint: string;
  blocks: ReviewBlock[];
};

export type BatchChange = {
  owner: string;
  route: string | null;
  blockId: string;
  beforeFingerprint: string;
  afterFingerprint: string;
  beforeValue: string;
  afterValue: string;
  plainText: string;
  changedAt: string;
};

export type ReviewBatch = {
  id: string;
  branch: string | null;
  baseSha: string;
  createdAt: string;
  updatedAt: string;
  changes: Record<string, BatchChange>;
};

export type PublishStage =
  | 'local-draft'
  | 'validated'
  | 'signed-commit'
  | 'pushed-branch'
  | 'pull-request'
  | 'required-checks'
  | 'merged'
  | 'github-pages-live';

export type PublishReceipt = {
  commitSha?: string;
  branch?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  mergeSha?: string;
  workflowUrl?: string;
  deploymentUrl?: string;
  liveRoutes?: string[];
};

export type PublishRun = {
  id: string;
  idempotencyKey: string;
  batchId: string;
  status: 'running' | 'failed' | 'complete';
  stage: PublishStage;
  message: string;
  startedAt: string;
  updatedAt: string;
  error: string | null;
  receipt: PublishReceipt;
};

export type CopyReviewCatalog = {
  generatedAt: string;
  repository: {
    branch: string;
    headSha: string;
    mainSha: string;
    fresh: boolean;
    dirtyFiles: string[];
  };
  surfaces: ReviewSurface[];
  totals: Record<ReviewStatus, number>;
  batch: ReviewBatch;
};
