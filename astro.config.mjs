import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import { contentRedirects } from './src/content-manifest.mjs';
import { site } from './src/site';
import starlightDevSearch from './src/integrations/starlight-dev-search.mjs';
import linkMetadata from './src/rehype/link-metadata.mjs';
import publicationElements from './src/rehype/publication-elements.mjs';

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
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  markdown: { processor: unified({ rehypePlugins: [linkMetadata, publicationElements] }) },
  redirects,
  integrations: [
    sitemap({ filter: (page) => {
      const pathname = new URL(page).pathname;
      return !redirectedPaths.has(pathname);
    } }),
    starlight({
      title: site.name,
      customCss: ['./src/styles/starwind.css', './src/styles/global.css'],
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
        ThemeProvider: './src/components/StarlightThemeProvider.astro',
      },
      social: [{ icon: 'github', label: 'GitHub', href: repository }],
      lastUpdated: false,
      pagination: false,
    }),
  ],

  vite: {
    plugins: [starlightDevSearch(), tailwindcss()],
  },
});
