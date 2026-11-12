import type { ComponentSchema } from '../schemas/component-schema';
import {
  ALIGNMENT_OPTIONS,
  EMAIL_SAFE_FONTS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_TRANSFORM_OPTIONS,
} from './common';

export const mjTextSchema: ComponentSchema = {
  type: 'mj-text',
  label: 'Text',
  description: 'Paragraph, heading, or rich formatted text block',
  allowedParents: ['mj-column', 'mj-hero'],
  allowedChildren: [],
  droppable: false,
  groups: [
    {
      id: 'typography',
      label: 'Typography',
      defaultOpen: true,
      fields: [
        {
          name: 'font-family',
          label: 'Font',
          type: 'font',
          defaultValue: 'Arial, Helvetica, sans-serif',
          options: EMAIL_SAFE_FONTS,
        },
        {
          name: 'font-size',
          label: 'Size',
          type: 'unit',
          defaultValue: '14px',
          units: ['px'],
          min: 9,
          max: 96,
        },
        {
          name: 'font-weight',
          label: 'Weight',
          type: 'select',
          defaultValue: '400',
          options: FONT_WEIGHT_OPTIONS,
        },
        {
          name: 'color',
          label: 'Color',
          type: 'color',
          defaultValue: '#111827',
        },
        {
          name: 'line-height',
          label: 'Line Height',
          type: 'unit',
          defaultValue: '1.5',
          units: ['', 'px', '%'],
          placeholder: '1.5 or 22px',
        },
        {
          name: 'letter-spacing',
          label: 'Letter Spacing',
          type: 'unit',
          defaultValue: 'normal',
          units: ['px'],
          placeholder: 'normal or 1px',
        },
      ],
    },
    {
      id: 'alignment',
      label: 'Alignment',
      defaultOpen: true,
      fields: [
        {
          name: 'align',
          label: 'Alignment',
          type: 'segmented',
          defaultValue: 'left',
          options: ALIGNMENT_OPTIONS,
        },
      ],
    },
    {
      id: 'formatting',
      label: 'Formatting',
      defaultOpen: true,
      fields: [
        {
          name: 'font-style',
          label: 'Style',
          type: 'segmented',
          defaultValue: 'normal',
          options: FONT_STYLE_OPTIONS,
        },
        {
          name: 'text-decoration',
          label: 'Decoration',
          type: 'segmented',
          defaultValue: 'none',
          options: TEXT_DECORATION_OPTIONS,
        },
        {
          name: 'text-transform',
          label: 'Transform',
          type: 'select',
          defaultValue: 'none',
          options: TEXT_TRANSFORM_OPTIONS,
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
          defaultValue: '10px 0px 10px 0px',
          helpText: 'Spacing around text inside the column',
        },
      ],
    },
    {
      id: 'appearance',
      label: 'Background',
      defaultOpen: true,
      fields: [
        {
          name: 'container-background-color',
          label: 'Background',
          type: 'color',
          defaultValue: '',
          placeholder: 'Transparent',
          helpText: 'Background color behind this text block',
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
          placeholder: 'e.g. hide-on-mobile',
        },
      ],
    },
  ],
};
