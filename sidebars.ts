import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Guida Rapida',
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/seeding',
      ],
    },
    {
      type: 'category',
      label: 'Architettura',
      items: [
        'architecture/overview',
        'architecture/backend-patterns',
        'architecture/frontend-patterns',
      ],
    },
    
{
  type: 'category',
  label: 'Moduli',
  items: [
    {
      type: 'category',
      label: 'Clients',
      items: [
        'modules/clients/backend',
        'modules/clients/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Projects',
      items: [
        'modules/projects/backend',
        'modules/projects/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Tasks',
      items: [
        'modules/tasks/backend',
        'modules/tasks/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Meetings',
      items: [
        'modules/meetings/backend',
        'modules/meetings/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Payments',
      items: [
        'modules/payments/backend',
        'modules/payments/frontend',
      ],
    },

    {
      type: 'category',
      label: 'Costs',
      items: [
        'modules/costs/backend',
        'modules/costs/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Documents',
      items: [
        'modules/documents/backend',
        'modules/documents/frontend',
      ],
    },
  ],
},

    {
      type: 'category',
      label: 'Personalizzazione',
      items: [
        'customization/adding-fields',
        'customization/creating-modules',
        'customization/styling',
      ],
    },
    {
      type: 'category',
      label: 'Deploy',
      items: [
        'deployment/production',
        'deployment/optimization',
      ],
    },
  ],
};

export default sidebars;