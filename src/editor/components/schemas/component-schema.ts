/**
 * Schema types for the email template builder's style & property management.
 *
 * Every property maps directly to an authoritative MJML attribute so that
 * user edits synchronously mutate the MJML component model, update the live canvas,
 * participate in undo/redo, and compile to clean HTML without drift.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'unit'
  | 'slider'
  | 'color'
  | 'select'
  | 'segmented'
  | 'checkbox'
  | 'spacing'
  | 'radius'
  | 'border'
  | 'font'
  | 'url';

export interface FieldOption {
  label: string;
  value: string;
  icon?: string;
  title?: string;
}

export interface SchemaField {
  /** The exact MJML attribute name (e.g. 'background-color', 'font-size', 'padding') */
  name: string;
  /** Human-readable label displayed in the inspector */
  label: string;
  /** Input control type */
  type: FieldType;
  /** Default value if not set on the component */
  defaultValue?: string | number | boolean;
  /** Placeholder hint text */
  placeholder?: string;
  /** Available choices for 'select' or 'segmented' */
  options?: FieldOption[];
  /** Allowed units for 'unit' fields (e.g. ['px', '%']) */
  units?: string[];
  /** Numeric constraints */
  min?: number;
  max?: number;
  step?: number;
  /** Display/output suffix for simple slider values (e.g. '%', 'px') */
  suffix?: string;
  /** Tooltip or compatibility guidance note */
  helpText?: string;
  /** Client compatibility warning (e.g. Outlook limitations) */
  clientWarning?: string;
}

export interface SchemaGroup {
  id: string;
  label: string;
  /** Whether the group is expanded by default */
  defaultOpen?: boolean;
  fields: SchemaField[];
}

export interface ComponentSchema {
  type: string;
  label: string;
  description?: string;
  allowedParents: string[];
  allowedChildren: string[];
  droppable: boolean;
  groups: SchemaGroup[];
}
