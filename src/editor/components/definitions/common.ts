import type { FieldOption } from '../schemas/component-schema';

export const EMAIL_SAFE_FONTS: FieldOption[] = [
  { label: 'System Sans-Serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica / Arial', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', 'Lucida Grande', Tahoma, sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Verdana, Segoe, sans-serif' },
  { label: 'Georgia (Serif)', value: "Georgia, Times, 'Times New Roman', serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Times, Georgia, serif" },
  { label: 'Courier New (Mono)', value: "'Courier New', Courier, monospace" },
];

export const ALIGNMENT_OPTIONS: FieldOption[] = [
  { label: 'Left', value: 'left', icon: 'left' },
  { label: 'Center', value: 'center', icon: 'center' },
  { label: 'Right', value: 'right', icon: 'right' },
  { label: 'Justify', value: 'justify', icon: 'justify' },
];

export const VERTICAL_ALIGN_OPTIONS: FieldOption[] = [
  { label: 'Top', value: 'top', icon: 'top' },
  { label: 'Middle', value: 'middle', icon: 'middle' },
  { label: 'Bottom', value: 'bottom', icon: 'bottom' },
];

export const FONT_WEIGHT_OPTIONS: FieldOption[] = [
  { label: 'Light (300)', value: '300' },
  { label: 'Regular (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semi-Bold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
];

export const FONT_STYLE_OPTIONS: FieldOption[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
];

export const TEXT_DECORATION_OPTIONS: FieldOption[] = [
  { label: 'None', value: 'none' },
  { label: 'Underline', value: 'underline' },
  { label: 'Line-Through', value: 'line-through' },
];

export const TEXT_TRANSFORM_OPTIONS: FieldOption[] = [
  { label: 'None', value: 'none' },
  { label: 'Uppercase', value: 'uppercase' },
  { label: 'Lowercase', value: 'lowercase' },
  { label: 'Capitalize', value: 'capitalize' },
];

export const BORDER_STYLE_OPTIONS: FieldOption[] = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' },
  { label: 'None', value: 'none' },
];
