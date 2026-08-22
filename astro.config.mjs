import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';
import { contentRedirects } from './src/content-manifest.mjs';
import { site } from './src/site';

const repository = site.repository;
const redirects = {
  ...contentRedirects(),
  '/changes/': site.releaseHistory,
};
const redirectedPaths = new Set(Object.keys(redirects));

export default defineConfig({
  site: 'https://agents.anipotts.com',
  output: 'static',
  redirects,
  integrations: [
    icon({
      include: {
        ph: ['app-window', 'terminal-window', 'brain', 'git-branch', 'arrow-right', 'arrow-up-right', 'github-logo', 'list'],
      },
    }),
    sitemap({ filter: (page) => {
      const pathname = new URL(page).pathname;
      return !pathname.startsWith('/__copy-review/') && !redirectedPaths.has(pathname);
    } }),
    starlight({
      title: site.name,
      customCss: ['./src/styles/global.css'],
      components: {
        Header: './src/components/StarlightHeader.astro',
        PageTitle: './src/components/StarlightPageTitle.astro',
        Footer: './src/components/StarlightFooter.astro',
        Sidebar: './src/components/StarlightSidebar.astro',
      },
      social: [{ icon: 'github', label: 'GitHub', href: repository }],
      editLink: { baseUrl: `${repository}/edit/main/` },
      lastUpdated: false,
      pagination: false,
    }),
  ],
});
