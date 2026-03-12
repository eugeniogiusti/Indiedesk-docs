import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Quick guide',
      items: [
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/backend-patterns',
        'architecture/frontend-patterns',
      ],
    },
    
{
  type: 'category',
  label: 'Modules',
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
      label: 'Invoice',
      items: [
        'modules/invoice/backend',
        'modules/invoice/frontend',
      ],
    },




    {
      type: 'category',
      label: 'Timesheets',
      items: [
        'modules/timesheets/backend',
        'modules/timesheets/frontend',
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
      label: 'Receipts',
      items: [
        'modules/receipts/backend',
        'modules/receipts/frontend',
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


    {
      type: 'category',
      label: 'Stats',
      items: [
        'modules/stats/backend',
        'modules/stats/frontend',
      ],
    },

    {
      type: 'category',
      label: 'Dashboard',
      items: [
        'modules/dashboard/backend',
        'modules/dashboard/frontend',
      ],
    },



    {
      type: 'category',
      label: 'Calendar',
      items: [
        'modules/calendar/backend',
        'modules/calendar/frontend',
      ],
    },


    {
      type: 'category',
      label: 'Company',
      items: [
        'modules/company/backend',
        'modules/company/frontend',
      ],
    },


    {
      type: 'category',
      label: 'Labels',
      items: [
        'modules/labels/backend',
        'modules/labels/frontend',
      ],
    },
    


    {
      type: 'category',
      label: '2fa',
      items: [
        'modules/2fa/backend',
        'modules/2fa/frontend',
      ],
    },

    {
      type: 'category',
      label: 'AI',
      items: [
        'modules/AI/backend',
        'modules/AI/frontend',
        'modules/AI/laravelboost',
      ],
    },

    {
      type: 'category',
      label: 'Taxes',
      items: [
        'modules/taxes/backend',
        'modules/taxes/frontend',
      ],
    },

    {
      type: 'category',
      label: 'GitHub',
      items: [
        'modules/github/backend',
        'modules/github/frontend',
      ],
    },
    

  ],
},


    'changelog',
  ],
};

export default sidebars;