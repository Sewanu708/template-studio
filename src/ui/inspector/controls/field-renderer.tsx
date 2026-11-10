import type { SchemaField } from '../../../editor/components/schemas/component-schema';
import { BorderField } from './border-field';
import { ColorField } from './color-field';
import { RadiusField } from './radius-field';
import { SegmentedField } from './segmented-field';
import { SelectField } from './select-field';
import { SliderField } from './slider-field';
import { SpacingField } from './spacing-field';
import { SwitchField } from './switch-field';
import { TextField } from './text-field';
import { UnitField } from './unit-field';

interface FieldRendererProps {
  field: SchemaField;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const currentValue = value ?? (field.defaultValue !== undefined ? String(field.defaultValue) : '');

  switch (field.type) {
    case 'segmented':
      return (
        <SegmentedField
          label={field.label}
          value={currentValue}
          options={field.options ?? []}
          onChange={onChange}
          helpText={field.helpText}
        />
      );

    case 'color':
      return (
        <ColorField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'unit':
      return (
        <UnitField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          units={field.units}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'slider':
      return (
        <SliderField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          min={field.min}
          max={field.max}
          step={field.step}
          suffix={field.suffix}
          helpText={field.helpText}
        />
      );

    case 'spacing':
      return (
        <SpacingField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          helpText={field.helpText}
        />
      );

    case 'radius':
      return (
        <RadiusField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          clientWarning={field.clientWarning}
        />
      );

    case 'border':
      return (
        <BorderField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'checkbox':
      return (
        <SwitchField
          label={field.label}
          value={currentValue === 'true' || currentValue === 'full-width' || Boolean(field.defaultValue && currentValue !== 'false')}
          onChange={(boolVal) => onChange(boolVal ? (field.name === 'full-width' ? 'full-width' : 'true') : '')}
          helpText={field.helpText}
        />
      );

    case 'font':
      return (
        <SelectField
          label={field.label}
          value={currentValue}
          options={field.options ?? []}
          onChange={onChange}
          isFont
          helpText={field.helpText}
        />
      );

    case 'select':
      return (
        <SelectField
          label={field.label}
          value={currentValue}
          options={field.options ?? []}
          onChange={onChange}
          helpText={field.helpText}
        />
      );

    case 'textarea':
      return (
        <TextField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          isTextarea
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'url':
      return (
        <TextField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          isUrl
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'text':
    default:
      return (
        <TextField
          label={field.label}
          value={currentValue}
          onChange={onChange}
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );
  }
}
