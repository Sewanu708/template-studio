import type { ComponentSchema } from '../schemas/component-schema';

export const mjBodySchema: ComponentSchema = {
  type: 'mj-body',
  label: 'Email Document',
  description: 'Global email canvas & body container',
  allowedParents: ['mjml'],
  allowedChildren: ['mj-section', 'mj-wrapper', 'mj-hero', 'mj-raw'],
  droppable: true,
  groups: [
    {
      id: 'document-settings',
      label: 'Canvas Settings',
      defaultOpen: true,
      fields: [
        {
          name: 'background-color',
          label: 'Canvas Background',
          type: 'color',
          defaultValue: '#ffffff',
          helpText: 'Background color of the email body container',
        },
        {
          name: 'width',
          label: 'Content Width',
          type: 'unit',
          defaultValue: '600px',
          units: ['px'],
          min: 320,
          max: 900,
          helpText: 'Standard email width (600px recommended for Gmail and Outlook)',
        },
      ],
    },
    {
      id: 'advanced',
      label: 'Advanced',
      defaultOpen: false,
      fields: [
        {
          name: 'css-class',
          label: 'CSS Class',
          type: 'text',
          defaultValue: '',
        },
      ],
    },
  ],
};
