import type { ComponentSchema } from '../schemas/component-schema';

export const mjSpacerSchema: ComponentSchema = {
  type: 'mj-spacer',
  label: 'Spacer',
  description: 'Vertical whitespace gap',
  allowedParents: ['mj-column'],
  allowedChildren: [],
  droppable: false,
  groups: [
    {
      id: 'dimensions',
      label: 'Height',
      defaultOpen: true,
      fields: [
        {
          name: 'height',
          label: 'Spacer Height',
          type: 'unit',
          defaultValue: '20px',
          units: ['px'],
          min: 4,
          max: 200,
          helpText: 'Vertical gap in pixels',
        },
      ],
    },
    {
      id: 'appearance',
      label: 'Appearance',
      defaultOpen: false,
      fields: [
        {
          name: 'container-background-color',
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
        },
      ],
    },
  ],
};
