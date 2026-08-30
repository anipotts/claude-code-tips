import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';
import sourceRegistry from '../docs/sources.json';

const sourceIds = new Set(sourceRegistry.sources.map((source) => source.id));
const sourceId = z.string().refine((id) => sourceIds.has(id), 'source identifier is absent from docs/sources.json');
const evidenceStatus = z.enum(['tested', 'official-source', 'analysis', 'open-question']);
const navigationScope = z.enum(['general', 'codex', 'claude-code', 'grok', 'opencode', 'qwen-code', 'kimi-code', 'aider']);
const voice = z.enum(['personal', 'evidence', 'documentary', 'frozen']);
const navigation = z.object({
  scope: navigationScope,
  order: z.number().int().nonnegative(),
  hidden: z.boolean().default(false),
});
const common = {
  products: z.array(z.string()).min(1),
  updatedAt: z.iso.datetime({ offset: true }),
  checkedAt: z.iso.datetime({ offset: true }).optional(),
  status: z.enum(['current', 'pending', 'archive']),
  evidence: z.array(evidenceStatus).min(1),
  sources: z.array(sourceId),
  redirects: z.array(z.string()).default([]),
  voice,
  navigation,
};

const docs = defineCollection({
  loader: glob({ base: './docs', pattern: ['guides/**/*.md', 'history.md', 'market.md', 'method.md', 'archive.md'] }),
  schema: docsSchema({ extend: z.object(common) }),
});

const home = defineCollection({
  loader: glob({ base: './content', pattern: 'home.md' }),
  schema: z.object({ title: z.string(), description: z.string(), ...common }),
});

const runs = defineCollection({
  loader: glob({ base: './content/runs', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    status: z.enum(['complete', 'partial', 'pending']),
    evidence: z.array(evidenceStatus).min(1),
    sources: z.array(sourceId),
    voice,
    product: z.string(),
    model: z.string().nullable(),
    version: z.string().nullable(),
    surface: z.string(),
    baseCommit: z.string(),
    task: z.string(),
    passCondition: z.string(),
    humanInterventions: z.number().int().nonnegative().nullable(),
    reviewMinutes: z.number().nonnegative().nullable(),
    machine: z.object({
      platform: z.string(),
      architecture: z.string(),
      memoryGb: z.number().nonnegative().nullable(),
      notes: z.string(),
    }),
    artifacts: z.array(z.object({
      kind: z.string(),
      url: z.url(),
      description: z.string(),
    })),
    privacy: z.array(z.string()),
    limitations: z.array(z.string()),
    openQuestions: z.array(z.string()),
  }),
});

export const collections = { docs, home, runs };
