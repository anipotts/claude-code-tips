import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';
import { contentRedirects } from './src/content-manifest.mjs';
import { site } from './src/site';
import linkMetadata from './src/rehype/link-metadata.mjs';

const repository = site.repository;
const socialImage = new URL(site.socialImage, site.url).href;
const redirects = {
  ...contentRedirects(),
  '/changes/': site.releaseHistory,
};
const redirectedPaths = new Set(Object.keys(redirects));

export default defineConfig({
  site: site.url,
  output: 'static',
  prefetch: false,
  markdown: { processor: unified({ rehypePlugins: [linkMetadata] }) },
  redirects,
  integrations: [
    {
      name: 'local-copy-review',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command === 'dev') injectRoute({ pattern: '/__copy-review/', entrypoint: './src/pages-dev/copy-review.astro' });
        },
      },
    },
    icon({
      include: {
        ph: [
          'app-window',
          'terminal-window',
          'brain',
          'git-branch',
          'arrow-right',
          'arrow-up-right',
          'book-open-text',
          'caret-down',
          'caret-double-left',
          'caret-double-right',
          'compass',
          'github-logo',
          'magnifying-glass',
          'desktop',
          'sun',
          'moon',
          'copy',
          'pencil-simple',
          'list',
          'dots-three',
          'sliders-horizontal',
          'shield-check',
          'x',
        ],
      },
    }),
    sitemap({ filter: (page) => {
      const pathname = new URL(page).pathname;
      return !pathname.startsWith('/__copy-review/') && !redirectedPaths.has(pathname);
    } }),
    starlight({
      title: site.name,
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: socialImage } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1280' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '640' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: site.socialImageAlt } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage } },
        { tag: 'meta', attrs: { name: 'twitter:image:alt', content: site.socialImageAlt } },
      ],
      components: {
        Head: './src/components/StarlightHead.astro',
        Header: './src/components/StarlightHeader.astro',
        PageTitle: './src/components/StarlightPageTitle.astro',
        PageSidebar: './src/components/StarlightPageSidebar.astro',
        MarkdownContent: './src/components/StarlightMarkdownContent.astro',
        Footer: './src/components/StarlightFooter.astro',
        Sidebar: './src/components/StarlightSidebar.astro',
      },
      social: [{ icon: 'github', label: 'GitHub', href: repository }],
      lastUpdated: false,
      pagination: false,
    }),
  ],
});
