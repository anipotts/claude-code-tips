import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';

const repository = 'https://github.com/anipotts/coding-agent-tips';

export default defineConfig({
  site: 'https://agents.anipotts.com',
  output: 'static',
  integrations: [
    icon({
      include: {
        ph: ['app-window', 'terminal-window', 'brain', 'git-branch', 'arrow-right', 'arrow-up-right', 'github-logo', 'list'],
      },
    }),
    sitemap(),
    starlight({
      title: 'coding agent tips',
      description:
        'evidence-backed guidance for coding agents in production software, from individual projects to startups and big tech.',
      customCss: ['./src/styles/global.css'],
      components: {
        Header: './src/components/StarlightHeader.astro',
        PageSidebar: './src/components/StarlightPageSidebar.astro',
        PageTitle: './src/components/StarlightPageTitle.astro',
      },
      social: [{ icon: 'github', label: 'GitHub', href: repository }],
      editLink: { baseUrl: `${repository}/edit/main/` },
      lastUpdated: false,
      sidebar: [
        {
          label: 'guides',
          items: [
            { label: 'all guides', slug: 'guides' },
            { label: 'codex', slug: 'guides/codex' },
            { label: 'claude code', slug: 'guides/claude-code' },
            { label: 'operating system', slug: 'guides/operating-system' },
          ],
        },
        {
          label: 'market',
          items: [
            { label: 'market map', slug: 'market' },
            { label: 'hardware', slug: 'market/hardware' },
          ],
        },
        {
          label: 'field work',
          items: [
            { label: 'field lab', slug: 'field-lab' },
            { label: 'method', slug: 'method' },
            { label: 'changes', slug: 'changes' },
            { label: 'legacy', slug: 'legacy' },
          ],
        },
      ],
    }),
  ],
});
