import type { ComponentSchema } from '../schemas/component-schema';

export const mjWrapperSchema: ComponentSchema = {
  type: 'mj-wrapper',
  label: 'Wrapper',
  description: 'Multi-section container for grouping sections with a shared background and border',
  allowedParents: ['mj-body'],
  allowedChildren: ['mj-section', 'mj-hero', 'mj-raw'],
  droppable: true,
  groups: [
    {
      id: 'layout',
      label: 'Wrapper Layout',
      defaultOpen: true,
      fields: [
        {
          name: 'full-width',
          label: 'Full Width',
          type: 'checkbox',
          defaultValue: false,
          helpText: 'Stretches background to 100% of the viewport',
        },
      ],
    },
    {
      id: 'background',
      label: 'Background',
      defaultOpen: true,
      fields: [
        {
          name: 'background-color',
          label: 'Background Color',
          type: 'color',
          defaultValue: '',
          placeholder: 'Transparent',
        },
        {
          name: 'background-url',
          label: 'Image URL',
          type: 'url',
          defaultValue: '',
          placeholder: 'https://cdn.example.com/bg.jpg',
        },
        {
          name: 'background-repeat',
          label: 'Repeat',
          type: 'select',
          defaultValue: 'no-repeat',
          options: [
            { label: 'No Repeat', value: 'no-repeat' },
            { label: 'Repeat', value: 'repeat' },
          ],
        },
        {
          name: 'background-size',
          label: 'Size',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Cover', value: 'cover' },
            { label: 'Contain', value: 'contain' },
          ],
        },
      ],
    },
    {
      id: 'spacing',
      label: 'Spacing',
      defaultOpen: true,
      fields: [
        {
          name: 'padding',
          label: 'Wrapper Padding',
          type: 'spacing',
          defaultValue: '0px',
        },
      ],
    },
    {
      id: 'borders',
      label: 'Border & Corners',
      defaultOpen: false,
      fields: [
        {
          name: 'border-radius',
          label: 'Corner Radius',
          type: 'radius',
          defaultValue: '0px',
          units: ['px'],
          min: 0,
          max: 60,
        },
        {
          name: 'border',
          label: 'All Sides',
          type: 'border',
          defaultValue: 'none',
          placeholder: '1px solid #e5e7eb',
        },
        {
          name: 'border-top',
          label: 'Top Border',
          type: 'border',
          defaultValue: 'none',
          placeholder: '1px solid #e5e7eb',
        },
        {
          name: 'border-right',
          label: 'Right Border',
          type: 'border',
          defaultValue: 'none',
          placeholder: '1px solid #e5e7eb',
        },
        {
          name: 'border-bottom',
          label: 'Bottom Border',
          type: 'border',
          defaultValue: 'none',
          placeholder: '1px solid #e5e7eb',
        },
        {
          name: 'border-left',
          label: 'Left Border',
          type: 'border',
          defaultValue: 'none',
          placeholder: '1px solid #e5e7eb',
        },
      ],
    },
    {
      id: 'advanced',
      label: 'Advanced',
      defaultOpen: false,
      fields: [
        {
          name: 'id',
          label: 'Wrapper ID',
          type: 'text',
          defaultValue: '',
        },
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
