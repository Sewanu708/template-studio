import type { ComponentSchema } from '../schemas/component-schema';
import { VERTICAL_ALIGN_OPTIONS } from './common';

export const mjGroupSchema: ComponentSchema = {
  type: 'mj-group',
  label: 'Inner Layout',
  description: 'Multi-column group that stays side-by-side on mobile without stacking',
  allowedParents: ['mj-section'],
  allowedChildren: ['mj-column'],
  droppable: true,
  groups: [
    {
      id: 'layout',
      label: 'Group Layout',
      defaultOpen: true,
      fields: [
        {
          name: 'width',
          label: 'Total Width',
          type: 'unit',
          defaultValue: '100%',
          units: ['%', 'px'],
        },
        {
          name: 'vertical-align',
          label: 'Vertical Alignment',
          type: 'segmented',
          defaultValue: 'top',
          options: VERTICAL_ALIGN_OPTIONS,
        },
        {
          name: 'direction',
          label: 'Direction',
          type: 'select',
          defaultValue: 'ltr',
          options: [
            { label: 'Left to Right (LTR)', value: 'ltr' },
            { label: 'Right to Left (RTL)', value: 'rtl' },
          ],
        },
      ],
    },
    {
      id: 'appearance',
      label: 'Appearance',
      defaultOpen: true,
      fields: [
        {
          name: 'background-color',
          label: 'Background Color',
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
          placeholder: 'e.g. products-group',
        },
      ],
    },
  ],
};
