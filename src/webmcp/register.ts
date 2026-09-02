import { navigate as astroNavigate } from 'astro:transitions/client';
import { AGENT_INDEX_VERSION } from '../agent-index-version.mjs';
import { createHandbookTools } from '../agent-contract.mjs';

type ToolDefinition = ReturnType<typeof createHandbookTools>[number];
type ModelContext = {
  registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): Promise<void>;
};
type RegistrationState = {
  controller?: AbortController;
  context?: ModelContext;
  queue: Promise<void>;
  lastError?: string;
};

declare global {
  interface Document { modelContext?: ModelContext }
  interface Window { __codingAgentTipsWebMcp?: RegistrationState }
}

let cachedIndex: unknown;
async function loadIndex(signal?: AbortSignal) {
  if (cachedIndex) return cachedIndex;
  const target = new URL('/agent-index.json', window.location.origin);
  const response = await fetch(target, { headers: { accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`agent index returned ${response.status}`);
  const index = await response.json();
  if (index?.schemaVersion !== AGENT_INDEX_VERSION) throw new Error('agent index version mismatch');
  cachedIndex = index;
  return index;
}

async function navigate(target: string) {
  const destination = new URL(target, window.location.origin);
  if (destination.origin !== window.location.origin) throw new Error('cross-origin navigation rejected');
  if (typeof astroNavigate === 'function') {
    await astroNavigate(destination.href);
    return;
  }
  window.location.assign(destination.href);
}

const state = window.__codingAgentTipsWebMcp ??= { queue: Promise.resolve() };

async function registerCurrentDocument() {
  state.controller?.abort();
  state.controller = undefined;
  state.context = undefined;
  state.lastError = undefined;

  const context = document.modelContext;
  if (!context || typeof context.registerTool !== 'function') return;

  const controller = new AbortController();
  state.controller = controller;
  state.context = context;
  const tools = createHandbookTools({ loadIndex, navigate });
  try {
    for (const tool of tools) await context.registerTool(tool, { signal: controller.signal });
  } catch (error) {
    controller.abort();
    if (state.controller === controller) {
      state.controller = undefined;
      state.context = undefined;
      state.lastError = error instanceof Error ? error.message : 'tool registration failed';
    }
  }
}

function setup() {
  state.queue = state.queue.catch(() => {}).then(registerCurrentDocument);
}

if (!document.documentElement.hasAttribute('data-webmcp-listener')) {
  document.documentElement.setAttribute('data-webmcp-listener', '');
  document.addEventListener('astro:page-load', setup);
  window.addEventListener('pagehide', () => state.controller?.abort());
}
