import type { ComponentSchema } from '../schemas/component-schema';
import { VERTICAL_ALIGN_OPTIONS } from './common';

export const mjColumnSchema: ComponentSchema = {
  type: 'mj-column',
  label: 'Column',
  description: 'Vertical column container within a section or group',
  allowedParents: ['mj-section', 'mj-group'],
  allowedChildren: ['mj-text', 'mj-image', 'mj-button', 'mj-divider', 'mj-spacer', 'mj-social'],
  droppable: true,
  groups: [
    {
      id: 'layout',
      label: 'Column Layout',
      defaultOpen: true,
      fields: [
        {
          name: 'width',
          label: 'Column Width',
          type: 'unit',
          defaultValue: '100%',
          units: ['%', 'px'],
          placeholder: 'e.g. 50% or 33.333%',
          helpText: 'Width relative to parent section row (typically percentages summing to 100%)',
        },
        {
          name: 'vertical-align',
          label: 'Vertical Alignment',
          type: 'segmented',
          defaultValue: 'top',
          options: VERTICAL_ALIGN_OPTIONS,
          helpText: 'Align content to the top, middle, or bottom of this column',
        },
        {
          name: 'direction',
          label: 'Direction',
          type: 'select',
          defaultValue: 'ltr',
          options: [
            { label: 'Left to Right', value: 'ltr' },
            { label: 'Right to Left', value: 'rtl' },
          ],
          helpText: 'Controls the column content direction for email clients that support it',
        },
      ],
    },
    {
      id: 'appearance',
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
      ],
    },
    {
      id: 'spacing',
      label: 'Spacing',
      defaultOpen: true,
      fields: [
        {
          name: 'padding',
          label: 'Column Padding',
          type: 'spacing',
          defaultValue: '0px',
          helpText: 'Internal spacing inside this column container',
        },
      ],
    },
    {
      id: 'border',
      label: 'Border & Corners',
      defaultOpen: true,
      fields: [
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
        {
          name: 'border-radius',
          label: 'Corner Radius',
          type: 'radius',
          defaultValue: '0px',
          units: ['px'],
          min: 0,
          max: 40,
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
          placeholder: 'e.g. sidebar-column',
        },
      ],
    },
  ],
};
