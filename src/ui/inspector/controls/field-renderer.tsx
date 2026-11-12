import type { Editor } from 'grapesjs';
import type { SchemaField } from '../../../editor/components/schemas/component-schema';
import { AssetUrlField } from './asset-url-field';
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
  editor?: Editor | null;
  attrs?: Record<string, string>;
  onAttrsChange?: (updates: Record<string, string>) => void;
}

interface SpacingSides {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  editor,
  attrs,
  onAttrsChange,
}: FieldRendererProps) {
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
      if (field.name === 'padding' && attrs && onAttrsChange) {
        return (
          <SpacingField
            label={field.label}
            value={getSideAwareSpacingValue(attrs, currentValue)}
            onChange={(nextValue) => {
              const sides = parseSpacingSides(nextValue);
              onAttrsChange({
                padding: '',
                'padding-top': sides.top,
                'padding-right': sides.right,
                'padding-bottom': sides.bottom,
                'padding-left': sides.left,
              });
            }}
            helpText={field.helpText}
          />
        );
      }

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
      if (field.name === 'border' && attrs && onAttrsChange) {
        return (
          <BorderField
            label={field.label}
            value={getAllSidesBorderValue(attrs, currentValue)}
            onChange={(nextValue) => {
              const value = nextValue === 'none' ? '' : nextValue;
              onAttrsChange({
                border: '',
                'border-top': value,
                'border-right': value,
                'border-bottom': value,
                'border-left': value,
                'border-width': '',
                'border-style': '',
                'border-color': '',
              });
            }}
            placeholder={field.placeholder}
            helpText={field.helpText}
          />
        );
      }

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
      if (editor && isImageAssetField(field)) {
        return (
          <AssetUrlField
            editor={editor}
            label={field.label}
            value={currentValue}
            onChange={onChange}
            placeholder={field.placeholder}
            helpText={field.helpText}
          />
        );
      }

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

function isImageAssetField(field: SchemaField): boolean {
  return (
    field.name === 'src'
    || field.name === 'background-url'
    || /image/i.test(field.label)
  );
}

function getSideAwareSpacingValue(attrs: Record<string, string>, fallback: string): string {
  const hasIndividualPadding = (
    attrs['padding-top'] !== undefined
    || attrs['padding-right'] !== undefined
    || attrs['padding-bottom'] !== undefined
    || attrs['padding-left'] !== undefined
  );

  if (!hasIndividualPadding) return fallback;

  const shorthandSides = parseSpacingSides(fallback || '0px');

  return [
    attrs['padding-top'] ?? shorthandSides.top,
    attrs['padding-right'] ?? shorthandSides.right,
    attrs['padding-bottom'] ?? shorthandSides.bottom,
    attrs['padding-left'] ?? shorthandSides.left,
  ].join(' ');
}

function getAllSidesBorderValue(attrs: Record<string, string>, fallback: string): string {
  const sides = [
    attrs['border-top'],
    attrs['border-right'],
    attrs['border-bottom'],
    attrs['border-left'],
  ].filter((value): value is string => Boolean(value));

  if (!sides.length) return attrs.border ?? fallback;

  const [first] = sides;
  const allSidesMatch = sides.length === 4 && sides.every((value) => value === first);

  return allSidesMatch ? first : 'none';
}

function parseSpacingSides(value: string): SpacingSides {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    const side = formatSpacingPart(parts[0]);
    return { top: side, right: side, bottom: side, left: side };
  }

  if (parts.length === 2) {
    const vertical = formatSpacingPart(parts[0]);
    const horizontal = formatSpacingPart(parts[1]);

    return {
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal,
    };
  }

  if (parts.length === 3) {
    const top = formatSpacingPart(parts[0]);
    const horizontal = formatSpacingPart(parts[1]);
    const bottom = formatSpacingPart(parts[2]);

    return {
      top,
      right: horizontal,
      bottom,
      left: horizontal,
    };
  }

  if (parts.length >= 4) {
    return {
      top: formatSpacingPart(parts[0]),
      right: formatSpacingPart(parts[1]),
      bottom: formatSpacingPart(parts[2]),
      left: formatSpacingPart(parts[3]),
    };
  }

  return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
}

function formatSpacingPart(value: string | undefined): string {
  const trimmed = String(value ?? '').trim();

  if (!trimmed || trimmed === '0') return '0px';
  if (/^-?\d*\.?\d+(px|%|em|rem)$/i.test(trimmed)) return trimmed;
  if (/^-?\d*\.?\d+$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}
