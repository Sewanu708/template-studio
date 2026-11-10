import type { ComponentSchema } from '../schemas/component-schema';
import { BORDER_STYLE_OPTIONS } from './common';

export const mjSectionSchema: ComponentSchema = {
  type: 'mj-section',
  label: 'Section',
  description: 'Full-width or bounded horizontal row container',
  allowedParents: ['mj-body', 'mj-wrapper'],
  allowedChildren: ['mj-column', 'mj-group'],
  droppable: true,
  groups: [
    {
      id: 'layout',
      label: 'Section Layout',
      defaultOpen: true,
      fields: [
        {
          name: 'full-width',
          label: 'Full Width Background',
          type: 'checkbox',
          defaultValue: false,
          helpText: 'Stretches the background color edge-to-edge while keeping content 600px',
        },
        {
          name: 'text-align',
          label: 'Text Align',
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
      id: 'background',
      label: 'Background',
      defaultOpen: true,
      fields: [
        {
          name: 'background-color',
          label: 'Background Color',
          type: 'color',
          defaultValue: '',
          placeholder: 'Transparent or #ffffff',
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
            { label: 'Repeat X', value: 'repeat-x' },
            { label: 'Repeat Y', value: 'repeat-y' },
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
        {
          name: 'background-position',
          label: 'Position',
          type: 'select',
          defaultValue: 'center center',
          options: [
            { label: 'Center', value: 'center center' },
            { label: 'Top Left', value: 'top left' },
            { label: 'Top Center', value: 'top center' },
            { label: 'Top Right', value: 'top right' },
            { label: 'Bottom Center', value: 'bottom center' },
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
          label: 'Section Padding',
          type: 'spacing',
          defaultValue: '0px',
          helpText: 'Top and bottom spacing separating sections',
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
          label: 'Border',
          type: 'border',
          defaultValue: 'none',
          placeholder: '1px solid #e5e7eb',
        },
        {
          name: 'border-style',
          label: 'Border Style',
          type: 'select',
          defaultValue: 'none',
          options: BORDER_STYLE_OPTIONS,
        },
        {
          name: 'border-width',
          label: 'Border Width',
          type: 'unit',
          defaultValue: '',
          units: ['px'],
          min: 0,
          max: 20,
        },
        {
          name: 'border-color',
          label: 'Border Color',
          type: 'color',
          defaultValue: '',
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
          label: 'Section ID',
          type: 'text',
          defaultValue: '',
          placeholder: 'e.g. newsletter-header',
        },
        {
          name: 'css-class',
          label: 'CSS Class',
          type: 'text',
          defaultValue: '',
          placeholder: 'e.g. dark-section',
        },
      ],
    },
  ],
};
