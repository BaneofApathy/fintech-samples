import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://usf-fintech-algorithms.vercel.app',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  integrations: [
    svelte(),
    starlight({
      title: 'Fintech Algorithms',
      favicon: '/favicon.svg',
      customCss: [
        './src/styles/course.css',
        './src/styles/navigation.css',
        './src/styles/learning.css',
      ],
      sidebar: [{ label: 'Course', link: '/' }],
      components: {
        Header: './src/components/layout/Header.astro',
        Sidebar: './src/components/layout/Sidebar.astro',
        MobileMenuToggle: './src/components/layout/NoMobileToggle.astro',
      },
      pagefind: false,
      disable404Route: true,
    }),
    mdx(),
  ],
});
