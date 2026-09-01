import type { CopyReviewCatalog, PublishRun, PublishStage, ReviewBlock, ReviewDocument, ReviewStatus } from './types';

const page = document.body as HTMLBodyElement;
const token = page.dataset.copyReviewToken ?? '';
const workspace = document.querySelector<HTMLElement>('.review-workspace')!;
const tree = document.querySelector<HTMLElement>('[data-writing-tree]')!;
const coverage = document.querySelector<HTMLElement>('[data-coverage]')!;
const search = document.querySelector<HTMLInputElement>('[data-search]')!;
const sourceOutline = document.querySelector<HTMLElement>('[data-source-outline]')!;
const sourceInspector = document.querySelector<HTMLElement>('[data-source-inspector]')!;
const sourceView = document.querySelector<HTMLElement>('[data-source-view]')!;
const renderedView = document.querySelector<HTMLElement>('[data-rendered-view]')!;
const previewStage = document.querySelector<HTMLElement>('[data-preview-stage]')!;
const previewFrame = document.querySelector<HTMLIFrameElement>('[data-preview-frame]')!;
const workspaceMessage = document.querySelector<HTMLElement>('[data-workspace-message]')!;
const currentBlockPanel = document.querySelector<HTMLElement>('[data-current-block]')!;
const publishButton = document.querySelector<HTMLButtonElement>('[data-publish]')!;
const validationStatus = document.querySelector<HTMLElement>('[data-validation-status]')!;
const validationOutput = document.querySelector<HTMLElement>('[data-validation-output]')!;
const mobilePanelButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-mobile-panel-target]')];
const mobilePanels = {
  tree: document.querySelector<HTMLElement>('.writing-rail')!,
  editor: document.querySelector<HTMLElement>('.editor-workspace')!,
  review: document.querySelector<HTMLElement>('.publish-rail')!,
};
const mobileMedia = window.matchMedia('(max-width: 68rem)');

let catalog: CopyReviewCatalog;
let currentDocument: ReviewDocument;
let selectedBlock: ReviewBlock | null = null;
let selectedOwner = '';
let mode: 'source' | 'rendered' = 'rendered';
let publication: PublishRun | null = null;
let mobilePanel: keyof typeof mobilePanels = 'editor';

const statusLabels: Record<ReviewStatus, string> = { 'needs-review': 'needs review', vetted: 'vetted', 'changed-since-vetting': 'changed since vetting', 'needs-revision': 'needs revision' };
const groups: Array<[ReviewDocument['group'], string]> = [['homepage', 'homepage'], ['handbook', 'handbook'], ['codex', 'codex'], ['claude-code', 'claude code'], ['grok', 'grok'], ['archive', 'archive']];
const stages: PublishStage[] = ['local-draft', 'validated', 'signed-commit', 'pushed-branch', 'pull-request', 'required-checks', 'merged', 'github-pages-live'];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setMobilePanel(panel: keyof typeof mobilePanels, focus = false) {
  mobilePanel = panel;
  page.dataset.mobilePanel = panel;
  for (const button of mobilePanelButtons) {
    const selected = button.dataset.mobilePanelTarget === panel;
    button.setAttribute('aria-selected', String(selected));
    if (selected && focus) button.focus();
  }
  for (const [name, surface] of Object.entries(mobilePanels)) {
    if (mobileMedia.matches) {
      const active = name === panel;
      surface.toggleAttribute('inert', !active);
      surface.setAttribute('aria-hidden', String(!active));
    } else {
      surface.removeAttribute('inert');
      surface.removeAttribute('aria-hidden');
    }
  }
}

async function api<T>(action: string, options: RequestInit = {}) {
  const response = await fetch(`/__copy-review/api/${action}`, { ...options, headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), 'x-copy-review-token': token, ...(options.headers ?? {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `copy review request failed (${response.status})`);
  return result as T;
}

function showMessage(message: string, tone: 'info' | 'error' = 'info') {
  workspaceMessage.textContent = message;
  workspaceMessage.dataset.tone = tone;
  workspaceMessage.hidden = false;
  window.setTimeout(() => { workspaceMessage.hidden = true; }, tone === 'error' ? 7000 : 3000);
}

function renderRepository() {
  document.querySelector<HTMLElement>('[data-repository-branch]')!.textContent = catalog.repository.branch || 'detached';
  const freshness = document.querySelector<HTMLElement>('[data-freshness]')!;
  freshness.dataset.state = catalog.repository.fresh ? 'fresh' : 'stale';
  freshness.lastChild!.textContent = catalog.repository.fresh ? 'fresh from origin' : 'base differs from origin/main';
}

function renderCoverage() {
  coverage.replaceChildren(...(['needs-review', 'changed-since-vetting', 'vetted', 'needs-revision'] as ReviewStatus[]).map((status) => {
    const row = element('div', 'coverage-row'); row.dataset.status = status;
    const label = element('span'); label.append(element('i'), document.createTextNode(statusLabels[status]));
    row.append(label, element('strong', '', String(catalog.totals[status]))); return row;
  }));
  document.querySelector<HTMLElement>('[data-mobile-pages-count]')!.textContent = String(catalog.totals['needs-review'] + catalog.totals['changed-since-vetting'] + catalog.totals['needs-revision']);
}

function compactCounts(counts: ReviewDocument['counts']) {
  const wrapper = element('span', 'surface-counts');
  for (const status of ['needs-review', 'changed-since-vetting', 'vetted', 'needs-revision'] as ReviewStatus[]) {
    if (!counts[status]) continue;
    const count = element('span', '', String(counts[status])); count.dataset.countStatus = status; count.title = statusLabels[status]; wrapper.append(count);
  }
  return wrapper;
}

function renderTree() {
  const query = search.value.trim().toLowerCase();
  const renderedGroups = groups.map(([groupId, groupLabel]) => {
    const surfaces = catalog.surfaces.filter((surface) => surface.group === groupId && (!query || `${surface.title} ${surface.owner} ${surface.route ?? ''}`.toLowerCase().includes(query)));
    if (!surfaces.length) return null;
    const details = element('details', 'tree-group'); details.open = groupId !== 'archive';
    const summary = element('summary'); summary.append(element('span', '', groupLabel), element('span', '', String(surfaces.reduce((sum, surface) => sum + Object.values(surface.counts).reduce((subtotal, value) => subtotal + value, 0), 0))));
    const list = element('div', 'surface-list');
    for (const surface of surfaces) {
      const button = element('button', 'surface-row') as HTMLButtonElement; button.type = 'button'; button.dataset.owner = surface.owner;
      if (surface.owner === selectedOwner) button.setAttribute('aria-current', 'page');
      button.append(element('span', '', surface.title), compactCounts(surface.counts)); button.addEventListener('click', () => void loadOwner(surface.owner)); list.append(button);
    }
    details.append(summary, list); return details;
  }).filter((node): node is HTMLDetailsElement => Boolean(node));
  tree.replaceChildren(...renderedGroups);
}

function renderDocumentHeader() {
  const breadcrumb = document.querySelector<HTMLElement>('[data-document-breadcrumb]')!;
  const parts = currentDocument.route === '/' ? ['home'] : (currentDocument.route ?? currentDocument.title).split('/').filter(Boolean);
  breadcrumb.replaceChildren(...parts.map((part) => element('span', '', part.replaceAll('-', ' '))));
  document.querySelector<HTMLElement>('[data-document-owner]')!.textContent = currentDocument.owner;
  document.querySelector<HTMLElement>('[data-document-updated]')!.textContent = `${currentDocument.blocks.length} reviewable blocks`;
}

function renderSourceOutline() {
  sourceOutline.replaceChildren(...currentDocument.blocks.map((block) => {
    const button = element('button', 'source-block') as HTMLButtonElement; button.type = 'button'; button.dataset.blockId = block.id; button.setAttribute('aria-current', String(selectedBlock?.id === block.id));
    const kind = block.kind === 'heading' ? block.rawSource.match(/^#{1,6}/)?.[0] ?? 'H' : block.kind;
    const copy = element('span', 'block-copy');
    if (['heading', 'frontmatter', 'interface-copy', 'evidence-copy'].includes(block.kind)) copy.append(element('strong', '', block.label));
    copy.append(element('code', '', block.value));
    const status = element('span', 'status-label', statusLabels[block.status]); status.dataset.status = block.status;
    button.append(element('span', 'block-kind', kind), copy, status); button.addEventListener('click', () => selectBlock(block.id)); return button;
  }));
}

function renderSourceInspector() {
  if (!selectedBlock) { sourceInspector.innerHTML = '<div class="editor-empty"><h3>select a content block</h3><p>edit the canonical source here, then switch to rendered to see the real Astro page.</p></div>'; return; }
  const block = selectedBlock;
  const editor = element('form', 'block-editor'); const header = element('div', 'block-editor-header'); const heading = element('div');
  heading.append(element('h3', '', block.label), element('p', '', `${block.owner} · lines ${block.lineStart}–${block.lineEnd} · ${block.fingerprint.slice(0, 8)}`));
  const status = element('span', 'status-label', statusLabels[block.status]); status.dataset.status = block.status; header.append(heading, status);
  const textarea = element('textarea') as HTMLTextAreaElement; textarea.value = block.value; textarea.spellcheck = true; textarea.setAttribute('aria-label', `edit ${block.label}`);
  const actions = element('div', 'editor-actions'); const cancel = element('button', 'cancel-edit', 'cancel') as HTMLButtonElement; cancel.type = 'button'; const save = element('button', 'save-edit', 'save edit') as HTMLButtonElement; save.type = 'submit'; save.disabled = true;
  textarea.addEventListener('input', () => { const dirty = textarea.value !== block.value; textarea.dataset.dirty = String(dirty); save.disabled = !dirty; });
  cancel.addEventListener('click', () => { textarea.value = block.value; textarea.dataset.dirty = 'false'; save.disabled = true; });
  editor.addEventListener('submit', async (event) => {
    event.preventDefault(); save.disabled = true; save.textContent = 'saving…';
    try {
      const result = await api<{ document: ReviewDocument }>('edit', { method: 'POST', body: JSON.stringify({ owner: block.owner, blockId: block.id, baseFingerprint: block.fingerprint, value: textarea.value }) });
      currentDocument = result.document; catalog = await api<CopyReviewCatalog>('catalog'); selectedBlock = currentDocument.blocks.find((candidate) => candidate.id === block.id) ?? null; renderAll(); refreshPreview(); showMessage('saved to the canonical source and refreshed the review batch');
    } catch (error) { showMessage(error instanceof Error ? error.message : String(error), 'error'); } finally { save.textContent = 'save edit'; }
  });
  textarea.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (!save.disabled) editor.requestSubmit(); } });
  actions.append(cancel, save); editor.append(header, textarea, actions); sourceInspector.replaceChildren(editor);
}

function renderCurrentBlock() {
  if (!selectedBlock) { currentBlockPanel.innerHTML = '<p class="empty-copy">select a source block to review it.</p>'; return; }
  const block = selectedBlock; const card = element('div', 'current-block-card'); const summary = element('div'); const copy = element('div');
  copy.append(element('strong', '', block.label), element('p', '', `lines ${block.lineStart}–${block.lineEnd} · ${block.kind}`)); const status = element('span', 'status-label', statusLabels[block.status]); status.dataset.status = block.status; summary.append(copy, status);
  const buttons = element('div', 'review-buttons');
  for (const decision of ['vetted', 'needs-revision'] as const) {
    const button = element('button', '', decision === 'vetted' ? 'vetted' : 'needs revision') as HTMLButtonElement; button.type = 'button'; button.dataset.decision = decision; button.setAttribute('aria-pressed', String(block.decision === decision && (decision === 'needs-revision' || block.status === 'vetted')));
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { const result = await api<{ document: ReviewDocument }>('review', { method: 'POST', body: JSON.stringify({ owner: block.owner, blockId: block.id, fingerprint: block.fingerprint, decision }) }); currentDocument = result.document; selectedBlock = currentDocument.blocks.find((candidate) => candidate.id === block.id) ?? null; catalog = await api<CopyReviewCatalog>('catalog'); renderAll(); showMessage(decision === 'vetted' ? 'recorded this exact block as vetted' : 'marked this block for revision'); }
      catch (error) { showMessage(error instanceof Error ? error.message : String(error), 'error'); } finally { button.disabled = false; }
    }); buttons.append(button);
  }
  card.append(summary, buttons); currentBlockPanel.replaceChildren(card);
}

function renderBatch() {
  const changes = Object.values(catalog.batch.changes); const pages = new Map<string, number>(); for (const change of changes) pages.set(change.owner, (pages.get(change.owner) ?? 0) + 1);
  document.querySelector<HTMLElement>('[data-batch-size]')!.textContent = changes.length ? `${changes.length} review decision${changes.length === 1 ? '' : 's'} across ${pages.size} page${pages.size === 1 ? '' : 's'}` : 'no edits yet';
  const mobileBatchCount = document.querySelector<HTMLElement>('[data-mobile-batch-count]')!;
  mobileBatchCount.textContent = String(changes.length);
  mobileBatchCount.toggleAttribute('hidden', changes.length === 0);
  const changedPages = document.querySelector<HTMLElement>('[data-changed-pages]')!;
  changedPages.replaceChildren(...[...pages].map(([owner, count]) => { const row = element('div', 'changed-page'); row.append(element('span', '', owner), element('strong', '', String(count))); return row; }));
  const unrelated = catalog.repository.dirtyFiles.filter((file) => !pages.has(file) && file !== 'editorial/copy-review-state.json'); const validBranch = catalog.repository.branch.startsWith('codex/copy-review-');
  publishButton.disabled = changes.length === 0 || unrelated.length > 0 || !validBranch || publication?.status === 'running'; publishButton.title = unrelated.length ? `unrelated changes: ${unrelated.join(', ')}` : !validBranch && changes.length ? 'publishing requires an editor-owned copy-review branch' : '';
  const receipt = document.querySelector<HTMLElement>('[data-receipt]')!; const entries: Array<[string, string, string?]> = [['batch', catalog.batch.id.slice(0, 8)], ['created', new Date(catalog.batch.createdAt).toLocaleString()], ['updated', new Date(catalog.batch.updatedAt).toLocaleString()]];
  if (publication?.receipt.commitSha) entries.push(['commit', publication.receipt.commitSha.slice(0, 8)]); if (publication?.receipt.pullRequestUrl) entries.push(['pull request', `#${publication.receipt.pullRequestNumber}`, publication.receipt.pullRequestUrl]); if (publication?.receipt.workflowUrl) entries.push(['deployment', 'workflow', publication.receipt.workflowUrl]);
  receipt.replaceChildren(...entries.map(([label, value, href]) => { const row = element('div'); row.append(element('dt', '', label)); const dd = element('dd'); if (href) { const anchor = element('a', '', value); anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noreferrer'; dd.append(anchor); } else dd.textContent = value; row.append(dd); return row; }));
}

function renderPipeline() {
  const activeIndex = publication ? stages.indexOf(publication.stage) : 0;
  for (const [index, stage] of stages.entries()) { const item = document.querySelector<HTMLElement>(`[data-stage="${stage}"]`)!; item.dataset.state = publication?.status === 'failed' && stage === publication.stage ? 'failed' : publication && index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'pending'; item.querySelector('small')!.textContent = index === activeIndex ? publication?.message ?? (stage === 'local-draft' ? 'in progress' : '') : ''; }
}

function renderAll() { renderRepository(); renderCoverage(); renderTree(); renderDocumentHeader(); renderSourceOutline(); renderSourceInspector(); renderCurrentBlock(); renderBatch(); renderPipeline(); workspace.setAttribute('aria-busy', 'false'); }
function selectBlock(id: string) { selectedBlock = currentDocument.blocks.find((block) => block.id === id) ?? null; renderSourceOutline(); renderSourceInspector(); renderCurrentBlock(); if (mode === 'rendered') instrumentPreview(); }
async function loadOwner(owner: string) { selectedOwner = owner; currentDocument = await api<ReviewDocument>(`document?owner=${encodeURIComponent(owner)}`); selectedBlock = currentDocument.blocks.find((block) => block.status !== 'vetted') ?? currentDocument.blocks[0] ?? null; renderAll(); refreshPreview(); if (mobileMedia.matches) setMobilePanel('editor'); }

function normalize(value: string) { return value.replace(/\s+/g, ' ').trim().toLowerCase(); }
function instrumentPreview() {
  const frameDocument = previewFrame.contentDocument; if (!frameDocument || !currentDocument?.route) return;
  const candidates = [...frameDocument.querySelectorAll<HTMLElement>('main h1,main h2,main h3,main h4,main p,main li,main th,main td,main pre')];
  for (const candidate of candidates) { candidate.style.outline = ''; candidate.style.outlineOffset = ''; }
  for (const block of currentDocument.blocks) {
    if (!block.plainText) continue; const wanted = normalize(block.plainText); const candidate = candidates.find((node) => { const text = normalize(node.textContent ?? ''); return text === wanted || (wanted.length > 36 && text.includes(wanted)); }); if (!candidate) continue;
    candidate.dataset.copyReviewBlock = block.id; candidate.style.cursor = 'pointer';
    if (selectedBlock?.id === block.id) { candidate.style.outline = '2px solid #1247e6'; candidate.style.outlineOffset = '4px'; candidate.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    if (!candidate.dataset.copyReviewBound) { candidate.dataset.copyReviewBound = 'true'; candidate.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); const id = candidate.dataset.copyReviewBlock; if (id) selectBlock(id); }); }
  }
}

function refreshPreview() {
  if (!currentDocument?.route) { previewFrame.removeAttribute('src'); document.querySelector<HTMLElement>('[data-preview-freshness]')!.textContent = 'shared copy renders across multiple routes'; return; }
  document.querySelector<HTMLElement>('[data-preview-freshness]')!.textContent = 'refreshing preview'; previewFrame.src = `${currentDocument.route}?copy-review=${Date.now()}`;
}
previewFrame.addEventListener('load', () => { document.querySelector<HTMLElement>('[data-preview-freshness]')!.textContent = 'up to date'; instrumentPreview(); });

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) button.addEventListener('click', () => { mode = button.dataset.mode as typeof mode; for (const candidate of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) candidate.setAttribute('aria-selected', String(candidate === button)); sourceView.hidden = mode !== 'source'; renderedView.hidden = mode !== 'rendered'; if (mode === 'rendered') { if (!previewFrame.src) refreshPreview(); else instrumentPreview(); } });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-viewport]')) button.addEventListener('click', () => { previewStage.dataset.viewportSize = button.dataset.viewport; for (const candidate of document.querySelectorAll<HTMLButtonElement>('[data-viewport]')) candidate.setAttribute('aria-pressed', String(candidate === button)); });
document.querySelector<HTMLButtonElement>('[data-jump-block]')!.addEventListener('click', () => { if (mode === 'source') sourceOutline.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(selectedBlock?.id ?? '')}"]`)?.scrollIntoView({ block: 'center' }); else instrumentPreview(); });
document.querySelector<HTMLButtonElement>('[data-collapse-tree]')!.addEventListener('click', () => mobileMedia.matches ? setMobilePanel('editor', true) : page.classList.toggle('tree-collapsed'));
document.querySelector<HTMLButtonElement>('[data-view-changes]')!.addEventListener('click', () => document.querySelector<HTMLElement>('[data-changed-pages]')!.scrollIntoView({ block: 'center' }));
document.querySelector<HTMLButtonElement>('[data-review-batch]')!.addEventListener('click', () => { const first = Object.values(catalog.batch.changes)[0]; if (!first) { showMessage('the current review batch is empty'); return; } void loadOwner(first.owner).then(() => selectBlock(first.blockId)); });

document.querySelector<HTMLButtonElement>('[data-validate]')!.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement; button.disabled = true; button.textContent = 'running focused checks…'; validationStatus.dataset.state = 'running'; validationStatus.querySelector('strong')!.textContent = 'checking the current batch';
  try { const result = await api<{ status: string; durationMs: number; output: string }>('validate', { method: 'POST', body: '{}' }); validationStatus.dataset.state = 'passed'; validationStatus.querySelector('strong')!.textContent = 'all content checks passed'; validationStatus.querySelector('p')!.textContent = `completed in ${(result.durationMs / 1000).toFixed(1)}s`; validationOutput.textContent = result.output; validationOutput.hidden = !result.output; }
  catch (error) { validationStatus.dataset.state = 'failed'; validationStatus.querySelector('strong')!.textContent = 'content checks failed'; validationStatus.querySelector('p')!.textContent = error instanceof Error ? error.message : String(error); }
  finally { button.disabled = false; button.textContent = 'run validation'; }
});

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const publishStorageKey = (batchId: string) => `copy-review-publish-${batchId}`;

function publicationIdempotencyKey() {
  const storageKey = publishStorageKey(catalog.batch.id);
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const created = `${catalog.batch.id}-${window.crypto.randomUUID()}`;
  window.sessionStorage.setItem(storageKey, created);
  return created;
}

async function observePublish(run: PublishRun) {
  publication = run;
  renderBatch();
  renderPipeline();
  let consecutiveFailures = 0;
  while (publication.status === 'running') {
    await wait(1_000);
    try {
      publication = await api<PublishRun>(`run?id=${encodeURIComponent(run.id)}`);
      consecutiveFailures = 0;
      renderBatch();
      renderPipeline();
    } catch {
      consecutiveFailures += 1;
      if (consecutiveFailures === 3) showMessage('publication status is temporarily unavailable; the server-side run is still preserved', 'error');
    }
  }
  if (publication.status === 'failed' && !publication.receipt.commitSha && !publication.receipt.pullRequestUrl) window.sessionStorage.removeItem(publishStorageKey(publication.batchId));
  catalog = await api<CopyReviewCatalog>('catalog');
  renderAll();
  showMessage(publication.status === 'complete' ? 'the exact approved batch is live' : publication.error ?? 'publication stopped', publication.status === 'failed' ? 'error' : 'info');
}

publishButton.addEventListener('click', async () => { publishButton.disabled = true; publishButton.textContent = 'starting protected publish…'; try { const run = await api<PublishRun>('publish', { method: 'POST', body: JSON.stringify({ idempotencyKey: publicationIdempotencyKey() }) }); void observePublish(run); } catch (error) { showMessage(error instanceof Error ? error.message : String(error), 'error'); renderBatch(); } finally { publishButton.textContent = 'approve & publish'; } });
for (const button of mobilePanelButtons) button.addEventListener('click', () => setMobilePanel(button.dataset.mobilePanelTarget as keyof typeof mobilePanels));
search.addEventListener('focus', () => { if (mobileMedia.matches) setMobilePanel('tree'); });
search.addEventListener('input', renderTree);
mobileMedia.addEventListener('change', () => setMobilePanel(mobilePanel));
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); } if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); search.focus(); } });

async function initialize() {
  try { catalog = await api<CopyReviewCatalog>('catalog'); selectedOwner = catalog.surfaces.find((surface) => surface.owner === 'content/guides/codex/configuration.md')?.owner ?? catalog.surfaces[0].owner; currentDocument = await api<ReviewDocument>(`document?owner=${encodeURIComponent(selectedOwner)}`); selectedBlock = currentDocument.blocks.find((block) => block.status !== 'vetted') ?? currentDocument.blocks[0] ?? null; renderAll(); setMobilePanel('editor'); refreshPreview(); }
  catch (error) { workspace.setAttribute('aria-busy', 'false'); showMessage(error instanceof Error ? error.message : String(error), 'error'); }
}
void initialize();
