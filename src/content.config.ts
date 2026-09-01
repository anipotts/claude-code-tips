import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';
import sourceRegistry from '../editorial/sources.json';

const sourceIds = new Set(sourceRegistry.sources.map((source) => source.id));
const sourceId = z.string().refine((id) => sourceIds.has(id), 'source identifier is absent from editorial/sources.json');
const evidenceStatus = z.enum(['tested', 'official-source', 'analysis', 'open-question']);
const navigationScope = z.enum(['handbook', 'codex', 'claude-code', 'grok', 'opencode', 'qwen-code', 'kimi-code', 'aider']);
const voice = z.enum(['personal', 'evidence', 'documentary', 'frozen']);
const completion = z.enum(['outline', 'excerpt', 'complete']);
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
  completion: completion.optional(),
  navigation,
};

const docs = defineCollection({
  loader: glob({ base: './content', pattern: ['guides/**/*.md', 'handbook/**/*.md', 'archive/**/*.md'] }),
  schema: docsSchema({ extend: z.object(common) }),
});

const home = defineCollection({
  loader: glob({ base: './content', pattern: 'home.md' }),
  schema: z.object({ title: z.string(), description: z.string(), ...common }),
});

export const collections = { docs, home };
