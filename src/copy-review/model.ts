import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { parseTree, type Node as JsonNode } from 'jsonc-parser';
import { toString as mdastToString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { isMap, isScalar, isSeq, parseDocument, stringify, type Node as YamlNode, type Pair } from 'yaml';
import type { Root, RootContent } from 'mdast';
import type {
  BatchChange,
  CopyReviewCatalog,
  ReviewBatch,
  ReviewBlock,
  ReviewBlockKind,
  ReviewDecision,
  ReviewDocument,
  ReviewLedger,
  ReviewStatus,
  ReviewSurface,
} from './types';

export const LEDGER_PATH = 'editorial/copy-review-state.json';
const SESSION_PATH = '.astro/copy-review-session.json';
const TOKEN_PATH = '.astro/copy-review-token';
const COPY_BRANCH_PREFIX = 'codex/copy-review-';
const TEXTUAL_FRONTMATTER_KEYS = new Set(['title', 'description', 'task', 'passCondition', 'notes', 'privacy', 'limitations', 'openQuestions']);
const SHARED_INTERFACE_OWNER = 'src/site.ts';
const SHARED_EVIDENCE_OWNER = 'editorial/sources.json';

type LocatedBlock = ReviewBlock & { start: number; end: number; adapter: 'markdown' | 'yaml' | 'typescript' | 'json'; source: string };
type SurfaceDefinition = Omit<ReviewSurface, 'counts'>;

export const emptyCounts = (): Record<ReviewStatus, number> => ({
  'needs-review': 0,
  vetted: 0,
  'changed-since-vetting': 0,
  'needs-revision': 0,
});

export const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex');
const normalizeText = (value: string) => value.replace(/[`*_>#\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (value: string) => normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
const lineAt = (source: string, offset: number) => source.slice(0, offset).split('\n').length;
const git = (root: string, args: string[], fallback = '') => {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return fallback; }
};
const gitRaw = (root: string, args: string[], fallback = '') => {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).replace(/\n$/, ''); } catch { return fallback; }
};

const absoluteOwner = (root: string, owner: string) => {
  const resolved = path.resolve(root, owner);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('source path is outside the repository');
  return resolved;
};

async function walkMarkdown(directory: string, root: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdown(absolute, root));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path.relative(root, absolute));
  }
  return files;
}

function frontmatterSlice(source: string) {
  if (!source.startsWith('---\n')) return null;
  const close = source.indexOf('\n---\n', 4);
  if (close === -1) return null;
  return { yaml: source.slice(4, close), yamlStart: 4, body: source.slice(close + 5), bodyStart: close + 5 };
}

function parseSurfaceMetadata(source: string) {
  const frontmatter = frontmatterSlice(source);
  if (!frontmatter) return {} as Record<string, unknown>;
  return parseDocument(frontmatter.yaml).toJS() as Record<string, unknown>;
}

function routeForOwner(owner: string) {
  if (owner === 'content/home.md') return '/';
  if (owner.startsWith('content/') && owner.endsWith('.md')) return `/${owner.slice('content/'.length, -3)}/`;
  return null;
}

function groupForOwner(owner: string): ReviewSurface['group'] {
  if (owner === 'content/home.md') return 'homepage';
  if (owner === SHARED_INTERFACE_OWNER || owner === SHARED_EVIDENCE_OWNER || owner.startsWith('content/handbook/')) return 'handbook';
  if (owner.includes('/guides/codex')) return 'codex';
  if (owner.includes('/guides/claude-code')) return 'claude-code';
  if (owner.includes('/guides/grok')) return 'grok';
  return 'archive';
}

async function surfaceDefinitions(root: string): Promise<SurfaceDefinition[]> {
  const owners = [
    'content/home.md',
    ...await walkMarkdown(path.join(root, 'content/handbook'), root),
    ...await walkMarkdown(path.join(root, 'content/guides'), root),
    ...await walkMarkdown(path.join(root, 'content/archive'), root),
  ];
  const definitions: SurfaceDefinition[] = [];
  for (const owner of owners) {
    const source = await readFile(absoluteOwner(root, owner), 'utf8');
    const metadata = parseSurfaceMetadata(source);
    const navigation = (metadata.navigation ?? {}) as Record<string, unknown>;
    const frozen = metadata.voice === 'frozen' || metadata.status === 'archive' || owner === 'content/archive/claude-code-tools.md';
    definitions.push({
      id: owner,
      owner,
      route: routeForOwner(owner),
      title: String(metadata.title ?? path.basename(owner, '.md').replaceAll('-', ' ')),
      description: String(metadata.description ?? ''),
      group: groupForOwner(owner),
      order: Number(navigation.order ?? 500),
      frozen,
    });
  }
  definitions.push({ id: 'shared-interface-copy', owner: SHARED_INTERFACE_OWNER, route: null, title: 'shared interface copy', description: 'navigation and shared interface labels', group: 'handbook', order: 950, frozen: false });
  definitions.push({ id: 'shared-evidence-copy', owner: SHARED_EVIDENCE_OWNER, route: null, title: 'evidence labels', description: 'shared evidence labels and explanations', group: 'handbook', order: 960, frozen: false });
  const groupOrder = ['homepage', 'handbook', 'codex', 'claude-code', 'grok', 'archive'];
  return definitions.sort((left, right) => groupOrder.indexOf(left.group) - groupOrder.indexOf(right.group) || left.order - right.order || left.title.localeCompare(right.title));
}

export async function readLedger(root: string): Promise<ReviewLedger> {
  try {
    const parsed = JSON.parse(await readFile(absoluteOwner(root, LEDGER_PATH), 'utf8')) as ReviewLedger;
    if (parsed.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object') throw new Error('unsupported review ledger');
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, entries: {} };
    throw error;
  }
}

async function writeJsonAtomic(file: string, value: unknown, mode = 0o600) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode });
  await rename(temporary, file);
}

export async function writeLedger(root: string, ledger: ReviewLedger) {
  await writeJsonAtomic(absoluteOwner(root, LEDGER_PATH), ledger, 0o644);
}

function reviewState(key: string, currentFingerprint: string, ledger: ReviewLedger): { status: ReviewStatus; decision: ReviewDecision | null } {
  const entry = ledger.entries[key];
  if (!entry) return { status: 'needs-review', decision: null };
  if (entry.decision === 'needs-revision') return { status: 'needs-revision', decision: entry.decision };
  if (entry.fingerprint !== currentFingerprint) return { status: 'changed-since-vetting', decision: entry.decision };
  return { status: 'vetted', decision: entry.decision };
}

function makeBlock(input: Omit<LocatedBlock, 'fingerprint' | 'status' | 'decision' | 'key' | 'lineStart' | 'lineEnd'> & { source: string; ledger: ReviewLedger }): LocatedBlock {
  const currentFingerprint = fingerprint(input.rawSource);
  const key = `${input.owner}#${input.id}`;
  const state = reviewState(key, currentFingerprint, input.ledger);
  const { ledger: _ledger, ...block } = input;
  return {
    ...block,
    key,
    fingerprint: currentFingerprint,
    lineStart: lineAt(input.source, input.start),
    lineEnd: lineAt(input.source, input.end),
    status: state.status,
    decision: state.decision,
  };
}

function yamlScalarBlocks(owner: string, source: string, yamlSource: string, yamlStart: number, ledger: ReviewLedger): LocatedBlock[] {
  const document = parseDocument(yamlSource, { keepSourceTokens: true });
  const blocks: LocatedBlock[] = [];
  const visit = (node: YamlNode | null | undefined, pathParts: string[]) => {
    if (!node) return;
    if (isMap(node)) {
      for (const rawPair of node.items) {
        const pair = rawPair as Pair;
        const key = isScalar(pair.key) ? String(pair.key.value) : 'value';
        visit(pair.value as YamlNode, [...pathParts, key]);
      }
      return;
    }
    if (isSeq(node)) {
      node.items.forEach((item, index) => visit(item as YamlNode, [...pathParts, String(index)]));
      return;
    }
    if (!isScalar(node) || typeof node.value !== 'string' || !node.range) return;
    if (!pathParts.some((part) => TEXTUAL_FRONTMATTER_KEYS.has(part))) return;
    const start = yamlStart + node.range[0];
    const end = yamlStart + node.range[1];
    const id = `frontmatter:${pathParts.join('.')}`;
    blocks.push(makeBlock({ id, owner, kind: 'frontmatter', label: pathParts.join(' / '), headingPath: ['frontmatter'], value: node.value, plainText: node.value, rawSource: source.slice(start, end), start, end, editable: true, adapter: 'yaml', source, ledger }));
  };
  visit(document.contents as YamlNode, []);
  return blocks;
}

function markdownBlocks(owner: string, source: string, ledger: ReviewLedger): LocatedBlock[] {
  const frontmatter = frontmatterSlice(source);
  const body = frontmatter?.body ?? source;
  const bodyStart = frontmatter?.bodyStart ?? 0;
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as Root;
  const headingPath: string[] = [];
  const counters = new Map<string, number>();
  const blocks: LocatedBlock[] = frontmatter ? yamlScalarBlocks(owner, source, frontmatter.yaml, frontmatter.yamlStart, ledger) : [];
  const kindFor = (node: RootContent): ReviewBlockKind => {
    if (node.type === 'heading') return 'heading';
    if (node.type === 'list') return 'list';
    if (node.type === 'table') return 'table';
    if (node.type === 'code') return 'code';
    if (node.type === 'blockquote') return 'blockquote';
    if (node.type === 'html') return 'html';
    return 'paragraph';
  };
  for (const node of tree.children) {
    if (!node.position?.start.offset && node.position?.start.offset !== 0) continue;
    if (!node.position?.end.offset && node.position?.end.offset !== 0) continue;
    const kind = kindFor(node);
    const plainText = mdastToString(node).trim() || (node.type === 'code' || node.type === 'html' ? node.value : kind);
    if (node.type === 'heading') {
      headingPath.splice(Math.max(0, node.depth - 1));
      headingPath[node.depth - 1] = slug(plainText);
      for (let index = node.depth; index < 6; index += 1) headingPath[index] = '';
    }
    const compactPath = headingPath.filter(Boolean);
    const counterKey = `${compactPath.join('/')}:${kind}`;
    const ordinal = (counters.get(counterKey) ?? 0) + 1;
    counters.set(counterKey, ordinal);
    const id = `body:${compactPath.join('/') || 'root'}:${kind}:${ordinal}`;
    const start = bodyStart + node.position.start.offset;
    const end = bodyStart + node.position.end.offset;
    const rawSource = source.slice(start, end);
    blocks.push(makeBlock({ id, owner, kind, label: kind === 'heading' ? plainText : `${kind} ${ordinal}`, headingPath: compactPath, value: rawSource, plainText: normalizeText(plainText || rawSource), rawSource, start, end, editable: true, adapter: 'markdown', source, ledger }));
  }
  return blocks;
}

function siteCopyBlocks(source: string, ledger: ReviewLedger): LocatedBlock[] {
  const file = ts.createSourceFile(SHARED_INTERFACE_OWNER, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const blocks: LocatedBlock[] = [];
  const objectLiteral = (node: ts.Expression): ts.ObjectLiteralExpression | null => {
    let current = node;
    while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) current = current.expression;
    return ts.isObjectLiteralExpression(current) ? current : null;
  };
  const arrayLiteral = (node: ts.Expression): ts.ArrayLiteralExpression | null => {
    let current = node;
    while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) current = current.expression;
    return ts.isArrayLiteralExpression(current) ? current : null;
  };
  const walkObject = (node: ts.ObjectLiteralExpression, pathParts: string[]) => {
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const name = property.name.getText(file).replace(/^['"]|['"]$/g, '');
      if (ts.isStringLiteralLike(property.initializer)) {
        const start = property.initializer.getStart(file);
        const end = property.initializer.getEnd();
        const id = `site:${[...pathParts, name].join('.')}`;
        blocks.push(makeBlock({ id, owner: SHARED_INTERFACE_OWNER, kind: 'interface-copy', label: [...pathParts, name].join(' / '), headingPath: pathParts, value: property.initializer.text, plainText: property.initializer.text, rawSource: source.slice(start, end), start, end, editable: true, adapter: 'typescript', source, ledger }));
      } else if (ts.isObjectLiteralExpression(property.initializer)) walkObject(property.initializer, [...pathParts, name]);
      else if (ts.isArrayLiteralExpression(property.initializer) && pathParts.includes('handbookScopes')) {
        property.initializer.elements.filter(ts.isObjectLiteralExpression).forEach((element, index) => walkObject(element, [...pathParts, name, String(index)]));
      }
    }
  };
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'site' && node.initializer && objectLiteral(node.initializer)) {
      const siteObject = objectLiteral(node.initializer)!;
      const interfaceCopy = siteObject.properties.find((property): property is ts.PropertyAssignment => ts.isPropertyAssignment(property) && property.name.getText(file) === 'interfaceCopy');
      if (interfaceCopy && ts.isObjectLiteralExpression(interfaceCopy.initializer)) walkObject(interfaceCopy.initializer, ['interfaceCopy']);
    }
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'handbookScopes' && node.initializer && arrayLiteral(node.initializer)) {
      arrayLiteral(node.initializer)!.elements.filter(ts.isObjectLiteralExpression).forEach((element, index) => {
        const idProperty = element.properties.find((property): property is ts.PropertyAssignment => ts.isPropertyAssignment(property) && property.name.getText(file) === 'id');
        const id = idProperty && ts.isStringLiteralLike(idProperty.initializer) ? idProperty.initializer.text : String(index);
        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property) || property.name.getText(file) !== 'label' || !ts.isStringLiteralLike(property.initializer)) continue;
          const start = property.initializer.getStart(file);
          const end = property.initializer.getEnd();
          const blockId = `site:navigationScopes.${id}.label`;
          blocks.push(makeBlock({ id: blockId, owner: SHARED_INTERFACE_OWNER, kind: 'interface-copy', label: `navigation / ${id}`, headingPath: ['navigation'], value: property.initializer.text, plainText: property.initializer.text, rawSource: source.slice(start, end), start, end, editable: true, adapter: 'typescript', source, ledger }));
        }
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return blocks;
}

function evidenceCopyBlocks(source: string, ledger: ReviewLedger): LocatedBlock[] {
  const tree = parseTree(source);
  if (!tree) throw new Error('editorial/sources.json is invalid');
  const blocks: LocatedBlock[] = [];
  const visit = (node: JsonNode, pathParts: string[]) => {
    if (node.type === 'property' && node.children?.length === 2) {
      const key = String(node.children[0].value);
      visit(node.children[1], [...pathParts, key]);
      return;
    }
    if (node.type === 'object' || node.type === 'array') {
      node.children?.forEach((child, index) => visit(child, node.type === 'array' ? [...pathParts, String(index)] : pathParts));
      return;
    }
    if (node.type !== 'string') return;
    const leaf = pathParts.at(-1);
    if (!pathParts.includes('evidence_labels') || (leaf !== 'label' && leaf !== 'description')) return;
    const id = `evidence:${pathParts.join('.')}`;
    blocks.push(makeBlock({ id, owner: SHARED_EVIDENCE_OWNER, kind: 'evidence-copy', label: pathParts.slice(1).join(' / '), headingPath: ['evidence labels'], value: String(node.value), plainText: String(node.value), rawSource: source.slice(node.offset, node.offset + node.length), start: node.offset, end: node.offset + node.length, editable: true, adapter: 'json', source, ledger }));
  };
  visit(tree, []);
  return blocks;
}

async function locatedDocument(root: string, definition: SurfaceDefinition, suppliedLedger?: ReviewLedger): Promise<{ document: ReviewDocument; located: LocatedBlock[] }> {
  const ledger = suppliedLedger ?? await readLedger(root);
  const source = await readFile(absoluteOwner(root, definition.owner), 'utf8');
  const located = definition.owner === SHARED_INTERFACE_OWNER ? siteCopyBlocks(source, ledger) : definition.owner === SHARED_EVIDENCE_OWNER ? evidenceCopyBlocks(source, ledger) : markdownBlocks(definition.owner, source, ledger);
  const counts = emptyCounts();
  if (!definition.frozen) for (const block of located) counts[block.status] += 1;
  const blocks = located.map(({ start: _start, end: _end, adapter: _adapter, source: _source, ...block }) => block);
  return { document: { ...definition, counts, fileFingerprint: fingerprint(source), blocks }, located };
}

export async function loadDocument(root: string, owner: string): Promise<ReviewDocument> {
  const definition = (await surfaceDefinitions(root)).find((item) => item.owner === owner);
  if (!definition) throw new Error('unknown writing surface');
  return (await locatedDocument(root, definition)).document;
}

export async function loadBatch(root: string): Promise<ReviewBatch> {
  try {
    return JSON.parse(await readFile(path.join(root, SESSION_PATH), 'utf8')) as ReviewBatch;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const now = new Date().toISOString();
    return { id: randomUUID(), branch: null, baseSha: git(root, ['rev-parse', 'HEAD']), createdAt: now, updatedAt: now, changes: {} };
  }
}

export async function saveBatch(root: string, batch: ReviewBatch) {
  batch.updatedAt = new Date().toISOString();
  await writeJsonAtomic(path.join(root, SESSION_PATH), batch);
}

export async function getSessionToken(root: string) {
  try { return (await readFile(path.join(root, TOKEN_PATH), 'utf8')).trim(); } catch {}
  const token = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
  await mkdir(path.dirname(path.join(root, TOKEN_PATH)), { recursive: true });
  await writeFile(path.join(root, TOKEN_PATH), token, { mode: 0o600 });
  return token;
}

export async function buildCatalog(root: string): Promise<CopyReviewCatalog> {
  const ledger = await readLedger(root);
  const definitions = await surfaceDefinitions(root);
  const surfaces: ReviewSurface[] = [];
  const totals = emptyCounts();
  for (const definition of definitions) {
    const document = (await locatedDocument(root, definition, ledger)).document;
    surfaces.push({ id: document.id, route: document.route, owner: document.owner, title: document.title, description: document.description, group: document.group, order: document.order, frozen: document.frozen, counts: document.counts });
    if (!document.frozen) for (const status of Object.keys(totals) as ReviewStatus[]) totals[status] += document.counts[status];
  }
  const branch = git(root, ['branch', '--show-current']);
  const headSha = git(root, ['rev-parse', 'HEAD']);
  const mainSha = git(root, ['rev-parse', 'origin/main'], headSha);
  const dirtyFiles = gitRaw(root, ['status', '--porcelain=v1']).split('\n').filter(Boolean).map((line) => (line.slice(3).includes(' -> ') ? line.slice(3).split(' -> ').at(-1)! : line.slice(3)));
  return { generatedAt: new Date().toISOString(), repository: { branch, headSha, mainSha, fresh: headSha === mainSha, dirtyFiles }, surfaces, totals, batch: await loadBatch(root) };
}

async function ensureBatchBranch(root: string, batch: ReviewBatch) {
  const branch = git(root, ['branch', '--show-current']);
  if (branch.startsWith(COPY_BRANCH_PREFIX)) { batch.branch = branch; return; }
  if (branch !== 'main') return;
  execFileSync('git', ['fetch', 'origin', 'main'], { cwd: root, stdio: 'pipe' });
  const head = git(root, ['rev-parse', 'HEAD']);
  const main = git(root, ['rev-parse', 'origin/main']);
  if (head !== main) throw new Error('local main is behind origin/main; refresh the editor before saving');
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'z').toLowerCase();
  const nextBranch = `${COPY_BRANCH_PREFIX}${timestamp}`;
  execFileSync('git', ['switch', '-c', nextBranch], { cwd: root, stdio: 'pipe' });
  batch.branch = nextBranch;
}

function encodeReplacement(block: LocatedBlock, nextValue: string) {
  if (block.adapter === 'markdown') return nextValue;
  if (block.adapter === 'json') return JSON.stringify(nextValue);
  if (block.adapter === 'yaml') return stringify(nextValue).trimEnd();
  const quote = block.rawSource.startsWith('"') ? '"' : "'";
  if (quote === '"') return JSON.stringify(nextValue);
  return `'${nextValue.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

function assertReplacementShape(block: LocatedBlock, nextValue: string) {
  if (block.adapter !== 'markdown') return;
  const tree = unified().use(remarkParse).use(remarkGfm).parse(nextValue) as Root;
  if (tree.children.length !== 1) throw new Error('a block edit must remain one Markdown block; edit adjacent blocks separately');
  const nextKind = tree.children[0].type === 'heading' ? 'heading' : tree.children[0].type === 'list' ? 'list' : tree.children[0].type === 'table' ? 'table' : tree.children[0].type === 'code' ? 'code' : tree.children[0].type === 'blockquote' ? 'blockquote' : tree.children[0].type === 'html' ? 'html' : 'paragraph';
  if (nextKind !== block.kind) throw new Error(`a ${block.kind} block must remain a ${block.kind} block`);
}

export async function editBlock(root: string, input: { owner: string; blockId: string; baseFingerprint: string; value: string }) {
  if (Buffer.byteLength(input.value, 'utf8') > 128_000) throw new Error('edited block is too large');
  const definition = (await surfaceDefinitions(root)).find((item) => item.owner === input.owner);
  if (!definition || definition.frozen) throw new Error('writing surface is not editable');
  const { located } = await locatedDocument(root, definition);
  const block = located.find((item) => item.id === input.blockId);
  if (!block || !block.editable) throw new Error('content block is not editable');
  if (block.fingerprint !== input.baseFingerprint) throw new Error('content changed after this editor loaded; reload the block before saving');
  const batch = await loadBatch(root);
  await ensureBatchBranch(root, batch);
  assertReplacementShape(block, input.value);
  const replacement = encodeReplacement(block, input.value);
  const nextSource = `${block.source.slice(0, block.start)}${replacement}${block.source.slice(block.end)}`;
  const file = absoluteOwner(root, input.owner);
  const undoDirectory = path.join(root, '.astro/copy-review-undo', batch.id);
  await mkdir(undoDirectory, { recursive: true });
  const undoFile = path.join(undoDirectory, `${fingerprint(input.owner)}.txt`);
  try { await stat(undoFile); } catch { await writeFile(undoFile, block.source, { mode: 0o600 }); }
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, nextSource, 'utf8');
  await rename(temporary, file);
  const updated = await loadDocument(root, input.owner);
  const nextBlock = updated.blocks.find((item) => item.id === input.blockId) ?? updated.blocks.find((item) => item.plainText === normalizeText(input.value));
  if (!nextBlock) throw new Error('saved content could not be located after parsing');
  const changeKey = `${input.owner}#${input.blockId}`;
  const existing = batch.changes[changeKey];
  const change: BatchChange = {
    owner: input.owner,
    route: definition.route,
    blockId: nextBlock.id,
    beforeFingerprint: existing?.beforeFingerprint ?? block.fingerprint,
    afterFingerprint: nextBlock.fingerprint,
    beforeValue: existing?.beforeValue ?? block.value,
    afterValue: nextBlock.value,
    plainText: nextBlock.plainText,
    changedAt: new Date().toISOString(),
  };
  if (change.beforeFingerprint === change.afterFingerprint) delete batch.changes[changeKey];
  else batch.changes[changeKey] = change;
  await saveBatch(root, batch);
  return { document: updated, batch };
}

export async function reviewBlock(root: string, input: { owner: string; blockId: string; fingerprint: string; decision: ReviewDecision }) {
  const document = await loadDocument(root, input.owner);
  if (document.frozen) throw new Error('archive copy is frozen');
  const block = document.blocks.find((item) => item.id === input.blockId);
  if (!block || block.fingerprint !== input.fingerprint) throw new Error('content changed after this review loaded; reload before recording a decision');
  const batch = await loadBatch(root);
  await ensureBatchBranch(root, batch);
  const ledger = await readLedger(root);
  ledger.entries[block.key] = { blockKey: block.key, owner: input.owner, blockId: block.id, decision: input.decision, fingerprint: block.fingerprint, reviewedAt: new Date().toISOString(), batchId: batch.id };
  await writeLedger(root, ledger);
  const changeKey = `${input.owner}#${input.blockId}`;
  if (!batch.changes[changeKey]) batch.changes[changeKey] = { owner: input.owner, route: document.route, blockId: block.id, beforeFingerprint: block.fingerprint, afterFingerprint: block.fingerprint, beforeValue: block.value, afterValue: block.value, plainText: block.plainText, changedAt: new Date().toISOString() };
  await saveBatch(root, batch);
  return { document: await loadDocument(root, input.owner), batch };
}

export function isCopyReviewBranch(branch: string) { return branch.startsWith(COPY_BRANCH_PREFIX); }
