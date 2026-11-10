import type { ComponentSchema } from '../schemas/component-schema';
import {
  EMAIL_SAFE_FONTS,
  FONT_WEIGHT_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_TRANSFORM_OPTIONS,
} from './common';

export const mjNavbarSchema: ComponentSchema = {
  type: 'mj-navbar',
  label: 'Navigation Bar',
  description: 'Header navigation menu with optional mobile hamburger toggle',
  allowedParents: ['mj-column', 'mj-hero'],
  allowedChildren: ['mj-navbar-link'],
  droppable: true,
  groups: [
    {
      id: 'navbar-settings',
      label: 'Menu Settings',
      defaultOpen: true,
      fields: [
        {
          name: 'hamburger',
          label: 'Mobile Hamburger',
          type: 'select',
          defaultValue: 'hamburger',
          options: [
            { label: 'Enabled (Hamburger on Mobile)', value: 'hamburger' },
            { label: 'Disabled (Keep links visible)', value: '' },
          ],
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
          name: 'ico-color',
          label: 'Hamburger Icon Color',
          type: 'color',
          defaultValue: '#111827',
        },
        {
          name: 'ico-font-size',
          label: 'Hamburger Size',
          type: 'unit',
          defaultValue: '30px',
          units: ['px'],
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

export const mjNavbarLinkSchema: ComponentSchema = {
  type: 'mj-navbar-link',
  label: 'Nav Link',
  description: 'Individual link item inside a navigation bar',
  allowedParents: ['mj-navbar'],
  allowedChildren: [],
  droppable: false,
  groups: [
    {
      id: 'link-destination',
      label: 'Link & Action',
      defaultOpen: true,
      fields: [
        {
          name: 'href',
          label: 'Destination URL',
          type: 'url',
          defaultValue: 'https://',
          placeholder: 'https://example.com/shop',
        },
        {
          name: 'target',
          label: 'Target',
          type: 'select',
          defaultValue: '_blank',
          options: [
            { label: 'New Tab (_blank)', value: '_blank' },
            { label: 'Same Window (_self)', value: '_self' },
          ],
        },
        {
          name: 'rel',
          label: 'Rel Attribute',
          type: 'text',
          defaultValue: '',
        },
      ],
    },
    {
      id: 'typography',
      label: 'Typography',
      defaultOpen: true,
      fields: [
        {
          name: 'color',
          label: 'Link Color',
          type: 'color',
          defaultValue: '#374151',
        },
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
        },
        {
          name: 'font-weight',
          label: 'Font Weight',
          type: 'select',
          defaultValue: '600',
          options: FONT_WEIGHT_OPTIONS,
        },
        {
          name: 'text-transform',
          label: 'Transform',
          type: 'select',
          defaultValue: 'uppercase',
          options: TEXT_TRANSFORM_OPTIONS,
        },
        {
          name: 'text-decoration',
          label: 'Decoration',
          type: 'segmented',
          defaultValue: 'none',
          options: TEXT_DECORATION_OPTIONS,
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
          label: 'Link Padding',
          type: 'spacing',
          defaultValue: '0px',
        },
      ],
    },
  ],
};
