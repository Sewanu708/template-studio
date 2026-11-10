import type { ComponentSchema } from '../schemas/component-schema';
import { BORDER_STYLE_OPTIONS } from './common';

export const mjDividerSchema: ComponentSchema = {
  type: 'mj-divider',
  label: 'Divider',
  description: 'Horizontal separator line',
  allowedParents: ['mj-column'],
  allowedChildren: [],
  droppable: false,
  groups: [
    {
      id: 'divider-style',
      label: 'Line Style',
      defaultOpen: true,
      fields: [
        {
          name: 'border-color',
          label: 'Line Color',
          type: 'color',
          defaultValue: '#e5e7eb',
        },
        {
          name: 'border-style',
          label: 'Line Style',
          type: 'select',
          defaultValue: 'solid',
          options: BORDER_STYLE_OPTIONS,
        },
        {
          name: 'border-width',
          label: 'Line Thickness',
          type: 'unit',
          defaultValue: '1px',
          units: ['px'],
          min: 1,
          max: 20,
        },
        {
          name: 'width',
          label: 'Divider Width',
          type: 'unit',
          defaultValue: '100%',
          units: ['%', 'px'],
        },
        {
          name: 'align',
          label: 'Alignment',
          type: 'segmented',
          defaultValue: 'center',
          options: [
            { label: 'Left', value: 'left', icon: 'left' },
            { label: 'Center', value: 'center', icon: 'center' },
            { label: 'Right', value: 'right', icon: 'right' },
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
          label: 'Padding',
          type: 'spacing',
          defaultValue: '0px',
        },
        {
          name: 'container-background-color',
          label: 'Container Background',
          type: 'color',
          defaultValue: '',
          placeholder: 'Transparent',
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
