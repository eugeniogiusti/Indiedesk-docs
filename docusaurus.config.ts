import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'IndieDesk',
  tagline:'A self-hosted workspace for indie developers, built on Laravel 12',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.indiedesk.link',
  baseUrl: '/',

  organizationName: 'eugeniogiusti',
  projectName: 'documentazione-template',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // SEO: Metadata
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'IndieDesk, Laravel, indie developer, self-hosted, project management, freelancer tools, Laravel 12, Alpine.js, Tailwind CSS, open source, developer workspace',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'author',
        content: 'Eugenio Giusti',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    // Structured Data (Schema.org)
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
        description: 'A self-hosted workspace for indie developers, built on Laravel 12. Manage projects, clients, tasks, invoices and more.',
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
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        // SEO: Sitemap automatica
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
    // SEO: Social card image for Open Graph and Twitter
    image: 'img/og-image.png',

    // SEO: Metadata
    metadata: [
      {name: 'description', content: 'IndieDesk - A self-hosted workspace for indie developers. Built with Laravel 12, manage projects, clients, tasks, invoices, and more. Full control over your data.'},
      {name: 'keywords', content: 'IndieDesk, Laravel, indie developer, self-hosted, project management, freelancer, task management, invoice, Laravel 12'},
      {property: 'og:title', content: 'IndieDesk - Self-Hosted Workspace for Indie Developers'},
      {property: 'og:description', content: 'A self-hosted workspace built with Laravel 12. Manage projects, clients, tasks, invoices and more. Full control over your data.'},
      {property: 'og:url', content: 'https://docs.indiedesk.link'},
      {property: 'og:image', content: 'https://docs.indiedesk.link/img/og-image.png'},
      {name: 'twitter:title', content: 'IndieDesk - Self-Hosted Workspace for Indie Developers'},
      {name: 'twitter:description', content: 'A self-hosted workspace built with Laravel 12 for indie developers and freelancers.'},
      {name: 'twitter:image', content: 'https://docs.indiedesk.link/img/og-image.png'},
    ],

    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Home',
      logo: {
        alt: 'Laravel Business Template for Indie developers',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'localeDropdown',
          position: 'right',
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
          href: 'http://indiedesk.link',
        },
        {
          label: 'Buy IndieDesk',
          href: 'https://eugeniogiusti.gumroad.com/l/indiedesk',
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