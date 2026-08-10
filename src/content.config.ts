import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';

const routes: Record<string, string> = {
  'README.md': 'guides',
  'codex/README.md': 'guides/codex',
  'claude-code/README.md': 'guides/claude-code',
  'shared/operating-system.md': 'guides/operating-system',
  'market/README.md': 'market',
  'market/hardware.md': 'market/hardware',
  'field-lab/README.md': 'field-lab',
  'methodology.md': 'method',
  'changes.md': 'changes',
  'legacy-tools.md': 'legacy',
};

const evidenceKind = z.enum(['hands-on', 'source-verified', 'inference', 'unknown']);

const docs = defineCollection({
  loader: glob({
    base: './docs',
    pattern: [
      'README.md',
      'codex/README.md',
      'claude-code/README.md',
      'shared/operating-system.md',
      'market/README.md',
      'market/hardware.md',
      'field-lab/README.md',
      'methodology.md',
      'changes.md',
      'legacy-tools.md',
    ],
    generateId: ({ entry }) => routes[entry] ?? entry.replace(/(?:\/README)?\.md$/, ''),
  }),
  schema: docsSchema({
    extend: z.object({
      products: z.array(z.string()),
      lastVerified: z.date(),
      status: z.enum(['current', 'pending', 'legacy']),
      evidence: z.array(evidenceKind),
      sources: z.array(z.string()),
      evidenceRail: z.array(
        z.object({
          kind: evidenceKind,
          label: z.string(),
          section: z.string(),
          sourceId: z.string().optional(),
        }),
      ),
    }),
  }),
});

export const collections = { docs };
