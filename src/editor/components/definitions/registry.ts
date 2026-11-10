import type { ComponentSchema } from '../schemas/component-schema';

import { mjBodySchema } from './body';
import { mjButtonSchema } from './button';
import { mjColumnSchema } from './column';
import { mjDividerSchema } from './divider';
import { mjGroupSchema } from './group';
import { mjHeroSchema } from './hero';
import { mjImageSchema } from './image';
import { mjNavbarLinkSchema, mjNavbarSchema } from './navbar';
import { mjSectionSchema } from './section';
import { mjSocialElementSchema, mjSocialSchema } from './social';
import { mjSpacerSchema } from './spacer';
import { mjTextSchema } from './text';
import { mjWrapperSchema } from './wrapper';

export * from './common';
export * from './body';
export * from './button';
export * from './column';
export * from './divider';
export * from './group';
export * from './hero';
export * from './image';
export * from './navbar';
export * from './section';
export * from './social';
export * from './spacer';
export * from './text';
export * from './wrapper';

/**
 * Authoritative component schema registry for all supported MJML elements.
 * Each entry provides exhaustive definitions for content, layout, typography,
 * appearance, spacing, and client-compatibility constraints.
 */
export const schemaRegistry: Record<string, ComponentSchema> = {
  'mj-body': mjBodySchema,
  'mj-section': mjSectionSchema,
  'mj-column': mjColumnSchema,
  'mj-group': mjGroupSchema,
  'mj-wrapper': mjWrapperSchema,
  'mj-text': mjTextSchema,
  'mj-button': mjButtonSchema,
  'mj-image': mjImageSchema,
  'mj-divider': mjDividerSchema,
  'mj-spacer': mjSpacerSchema,
  'mj-hero': mjHeroSchema,
  'mj-social': mjSocialSchema,
  'mj-social-element': mjSocialElementSchema,
  'mj-navbar': mjNavbarSchema,
  'mj-navbar-link': mjNavbarLinkSchema,
};

/**
 * Retrieve the schema definition for a component type or tag.
 */
export function getComponentSchema(type: string | undefined): ComponentSchema | null {
  if (!type) return null;
  return schemaRegistry[type] ?? null;
}
