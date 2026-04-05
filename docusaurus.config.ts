import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'IndieDesk',
  tagline: 'A self-hosted workspace for indie developers, built on Laravel 12',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.indiedesk.link',
  baseUrl: '/',
  // 1.trailingSlash fissato a false: evita che Google veda duplicati tra /pagina e /pagina/
  trailingSlash: false, 

  organizationName: 'eugeniogiusti',
  projectName: 'documentazione-template',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  headTags: [
    // Mantieni l'autore
    {
      tagName: 'meta',
      attributes: {
        name: 'author',
        content: 'Eugenio Giusti',
      },
    },
    // Mantieni lo Schema.org (JSON-LD) che è perfetto per la SEO
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'IndieDesk',
        applicationCategory: 'DeveloperApplication',
        description: 'A self-hosted workspace for indie developers, built on Laravel 12.',
        operatingSystem: 'Linux, Windows, macOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        author: {
          '@type': 'Person',
          name: 'Eugenio Giusti',
        },
        url: 'https://docs.indiedesk.link',
        softwareVersion: '1.0',
        programmingLanguage: 'PHP',
      }),
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false, // Disattivato, così i file nella cartella blog non vengono calcolati
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og-image.png',
    // 2. Metadata centralizzati qui (puliti i doppioni che erano in headTags)
    metadata: [
      {name: 'description', content: 'IndieDesk - A self-hosted workspace for indie developers. Built with Laravel 12.'},
      {name: 'keywords', content: 'IndieDesk, Laravel, indie developer, self-hosted, project management, Laravel 12'},
      {property: 'og:title', content: 'IndieDesk - Self-Hosted Workspace for Indie Developers'},
      {property: 'og:type', content: 'website'},
      {property: 'og:url', content: 'https://docs.indiedesk.link'},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],

    navbar: {
      title: 'Home',
      logo: {
        alt: 'IndieDesk Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          items: [
            {
              label: 'Website',
              href: 'https://indiedesk.link', // 3. Link con HTTPS corretto
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} IndieDesk. Built by an indie developer.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['php', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;