import type { ComponentSchema } from '../schemas/component-schema';
import { VERTICAL_ALIGN_OPTIONS } from './common';

export const mjHeroSchema: ComponentSchema = {
  type: 'mj-hero',
  label: 'Hero',
  description: 'Full-bleed hero banner with overlaid text and buttons',
  allowedParents: ['mj-body'],
  allowedChildren: ['mj-text', 'mj-button', 'mj-image', 'mj-divider'],
  droppable: true,
  groups: [
    {
      id: 'hero-background',
      label: 'Hero Background',
      defaultOpen: true,
      fields: [
        {
          name: 'background-url',
          label: 'Background Image',
          type: 'url',
          defaultValue: 'https://via.placeholder.com/600x400',
        },
        {
          name: 'background-color',
          label: 'Fallback Color',
          type: 'color',
          defaultValue: '#22c55e',
        },
        {
          name: 'height',
          label: 'Hero Height',
          type: 'unit',
          defaultValue: '350px',
          units: ['px'],
        },
        {
          name: 'mode',
          label: 'Height Mode',
          type: 'select',
          defaultValue: 'fixed-height',
          options: [
            { label: 'Fixed Height', value: 'fixed-height' },
            { label: 'Fluid Height', value: 'fluid-height' },
          ],
        },
        {
          name: 'background-width',
          label: 'Image Width',
          type: 'unit',
          defaultValue: '600px',
          units: ['px'],
        },
        {
          name: 'background-height',
          label: 'Image Height',
          type: 'unit',
          defaultValue: '350px',
          units: ['px'],
        },
        {
          name: 'background-position',
          label: 'Position',
          type: 'select',
          defaultValue: 'center center',
          options: [
            { label: 'Center', value: 'center center' },
            { label: 'Top', value: 'top center' },
            { label: 'Bottom', value: 'bottom center' },
          ],
        },
      ],
    },
    {
      id: 'spacing',
      label: 'Spacing & Alignment',
      defaultOpen: true,
      fields: [
        {
          name: 'vertical-align',
          label: 'Content Align',
          type: 'segmented',
          defaultValue: 'middle',
          options: VERTICAL_ALIGN_OPTIONS,
        },
        {
          name: 'padding',
          label: 'Internal Padding',
          type: 'spacing',
          defaultValue: '0px',
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
