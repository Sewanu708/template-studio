import type { ComponentSchema } from '../schemas/component-schema';
import { EMAIL_SAFE_FONTS } from './common';

export const mjSocialSchema: ComponentSchema = {
  type: 'mj-social',
  label: 'Social Links',
  description: 'Row or column of social network icons with optional text labels',
  allowedParents: ['mj-column', 'mj-hero'],
  allowedChildren: ['mj-social-element'],
  droppable: true,
  groups: [
    {
      id: 'social-layout',
      label: 'Layout & Icons',
      defaultOpen: true,
      fields: [
        {
          name: 'mode',
          label: 'Display Mode',
          type: 'segmented',
          defaultValue: 'horizontal',
          options: [
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
          ],
        },
        {
          name: 'icon-size',
          label: 'Icon Size',
          type: 'unit',
          defaultValue: '20px',
          units: ['px'],
          min: 12,
          max: 64,
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
        {
          name: 'border-radius',
          label: 'Icon Radius',
          type: 'radius',
          defaultValue: '3px',
          units: ['px'],
          min: 0,
          max: 32,
        },
      ],
    },
    {
      id: 'typography',
      label: 'Label Typography',
      defaultOpen: false,
      fields: [
        {
          name: 'font-family',
          label: 'Font Family',
          type: 'font',
          defaultValue: 'Arial, Helvetica, sans-serif',
          options: EMAIL_SAFE_FONTS,
        },
        {
          name: 'font-size',
          label: 'Font Size',
          type: 'unit',
          defaultValue: '13px',
          units: ['px'],
          min: 10,
          max: 24,
        },
        {
          name: 'color',
          label: 'Label Color',
          type: 'color',
          defaultValue: '#374151',
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
          label: 'Container Padding',
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

export const mjSocialElementSchema: ComponentSchema = {
  type: 'mj-social-element',
  label: 'Social Icon',
  description: 'Individual social network icon and link',
  allowedParents: ['mj-social'],
  allowedChildren: [],
  droppable: false,
  groups: [
    {
      id: 'element-content',
      label: 'Network & Link',
      defaultOpen: true,
      fields: [
        {
          name: 'name',
          label: 'Network',
          type: 'select',
          defaultValue: 'facebook',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Pinterest', value: 'pinterest' },
            { label: 'GitHub', value: 'github' },
            { label: 'Website (Web)', value: 'web' },
            { label: 'Custom Icon', value: 'custom' },
          ],
        },
        {
          name: 'href',
          label: 'Profile URL',
          type: 'url',
          defaultValue: 'https://',
          placeholder: 'https://instagram.com/yourbrand',
        },
        {
          name: 'src',
          label: 'Custom Icon URL',
          type: 'url',
          defaultValue: '',
          placeholder: 'https://cdn.example.com/icon.png',
          helpText: 'Only used when Network is set to Custom',
        },
        {
          name: 'alt',
          label: 'Alt Text',
          type: 'text',
          defaultValue: '',
        },
      ],
    },
    {
      id: 'element-style',
      label: 'Style & Colors',
      defaultOpen: true,
      fields: [
        {
          name: 'background-color',
          label: 'Icon Background',
          type: 'color',
          defaultValue: '',
          placeholder: 'Default network brand color',
        },
        {
          name: 'color',
          label: 'Label Text Color',
          type: 'color',
          defaultValue: '#ffffff',
        },
        {
          name: 'border-radius',
          label: 'Corner Radius',
          type: 'radius',
          defaultValue: '3px',
          units: ['px'],
        },
      ],
    },
    {
      id: 'spacing',
      label: 'Spacing',
      defaultOpen: false,
      fields: [
        {
          name: 'padding',
          label: 'Item Padding',
          type: 'spacing',
          defaultValue: '0px',
        },
      ],
    },
  ],
};
