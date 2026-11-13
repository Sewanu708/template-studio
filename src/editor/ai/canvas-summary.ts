/**
 * Canvas summary builder for AI context.
 * Provides a lightweight structural overview of the email without
 * sending large text content or image data.
 */

import type { Component, Editor } from 'grapesjs';
import type { CanvasSummary } from './agent-types';

const MAX_COLORS = 5;
const MAX_FONTS = 3;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getComponentType(component: Component): string {
  return (
    String(component.get('type') ?? '') ||
    String(component.get('tagName') ?? '')
  );
}

/**
 * Finds the mj-body component from the editor's wrapper.
 */
function findMjBody(editor: Editor): Component | null {
  const wrapper = editor.getWrapper();
  if (!wrapper) return null;

  // Direct children of the wrapper
  for (const child of wrapper.components().models) {
    const type = getComponentType(child);
    if (type === 'mjml') {
      // Find mj-body inside mjml
      for (const mjmlChild of child.components().models) {
        if (getComponentType(mjmlChild) === 'mj-body') {
          return mjmlChild;
        }
      }
    }
    if (type === 'mj-body') {
      return child;
    }
  }

  return null;
}

/**
 * Collects all mj-section components from mj-body,
 * including sections inside mj-wrapper.
 */
function collectSections(mjBody: Component): Component[] {
  const sections: Component[] = [];

  for (const child of mjBody.components().models) {
    const type = getComponentType(child);
    if (type === 'mj-section') {
      sections.push(child);
    } else if (type === 'mj-wrapper') {
      // Recursively collect sections inside wrapper
      for (const wrapperChild of child.components().models) {
        if (getComponentType(wrapperChild) === 'mj-section') {
          sections.push(wrapperChild);
        }
      }
    }
  }

  return sections;
}

/**
 * Counts columns in a section (including mj-group children).
 */
function countColumns(section: Component): number {
  let count = 0;

  for (const child of section.components().models) {
    const type = getComponentType(child);
    if (type === 'mj-column') {
      count += 1;
    } else if (type === 'mj-group') {
      // Count columns inside the group
      for (const groupChild of child.components().models) {
        if (getComponentType(groupChild) === 'mj-column') {
          count += 1;
        }
      }
    }
  }

  return count;
}

/**
 * Gets the content component types within a section.
 */
function getContentTypes(section: Component): string[] {
  const types = new Set<string>();

  function traverse(comp: Component): void {
    const type = getComponentType(comp);

    // Include MJML content types
    if (
      type === 'mj-text' ||
      type === 'mj-image' ||
      type === 'mj-button' ||
      type === 'mj-divider' ||
      type === 'mj-spacer' ||
      type === 'mj-social' ||
      type === 'mj-navbar' ||
      type === 'mj-hero' ||
      type === 'mj-raw'
    ) {
      types.add(type);
    }

    // Recurse into children
    for (const child of comp.components().models) {
      traverse(child);
    }
  }

  traverse(section);
  return Array.from(types);
}

/**
 * Extracts colors from inline styles and component attributes.
 * Excludes transparent, inherit, and similar non-color values.
 */
function extractColors(mjBody: Component): string[] {
  const colors = new Set<string>();
  const colorPattern = /#[0-9a-fA-F]{3,6}\b|rgb\([^)]+\)|rgba\([^)]+\)/gi;

  function traverse(comp: Component): void {
    // Check common color attributes
    const attrs = comp.getAttributes?.() || {};
    const colorAttrs = [
      'background-color',
      'backgroundColor',
      'color',
      'border-color',
      'borderColor',
      'container-background-color',
    ];

    for (const attr of colorAttrs) {
      const val = attrs[attr];
      if (val && typeof val === 'string') {
        const matches = val.match(colorPattern);
        if (matches) {
          matches.forEach((m) => colors.add(m.toLowerCase()));
        }
      }
    }

    // Check inline style string
    const style = attrs.style;
    if (style && typeof style === 'string') {
      const matches = style.match(colorPattern);
      if (matches) {
        matches.forEach((m) => colors.add(m.toLowerCase()));
      }
    }

    // Check component style object
    const styleObj = comp.getStyle?.();
    if (styleObj && typeof styleObj === 'object') {
      for (const [, val] of Object.entries(styleObj)) {
        if (val && typeof val === 'string') {
          const matches = val.match(colorPattern);
          if (matches) {
            matches.forEach((m) => colors.add(m.toLowerCase()));
          }
        }
      }
    }

    // Recurse
    for (const child of comp.components().models) {
      traverse(child);
    }
  }

  traverse(mjBody);

  // Limit to MAX_COLORS
  return Array.from(colors).slice(0, MAX_COLORS);
}

/**
 * Extracts font families from attributes and styles.
 */
function extractFonts(mjBody: Component): string[] {
  const fonts = new Set<string>();
  const fontPattern = /font-family:\s*([^;]+)/gi;

  function traverse(comp: Component): void {
    const attrs = comp.getAttributes?.() || {};

    // Check font-family attribute
    const fontFamily = attrs['font-family'] || attrs.fontFamily;
    if (fontFamily && typeof fontFamily === 'string') {
      // Extract first font in the stack
      const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      if (firstFont) fonts.add(firstFont);
    }

    // Check inline style
    const style = attrs.style;
    if (style && typeof style === 'string') {
      let match;
      while ((match = fontPattern.exec(style)) !== null) {
        const firstFont = match[1].split(',')[0].trim().replace(/['"]/g, '');
        if (firstFont) fonts.add(firstFont);
      }
    }

    // Check component style object
    const styleObj = comp.getStyle?.();
    if (styleObj && typeof styleObj === 'object') {
      const ff = styleObj['font-family'] || styleObj.fontFamily;
      if (ff && typeof ff === 'string') {
        const firstFont = ff.split(',')[0].trim().replace(/['"]/g, '');
        if (firstFont) fonts.add(firstFont);
      }
    }

    // Recurse
    for (const child of comp.components().models) {
      traverse(child);
    }
  }

  traverse(mjBody);

  // Limit to MAX_FONTS
  return Array.from(fonts).slice(0, MAX_FONTS);
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Builds a lightweight summary of the canvas structure.
 */
export function buildCanvasSummary(editor: Editor): CanvasSummary {
  const mjBody = findMjBody(editor);

  if (!mjBody) {
    return {
      sectionCount: 0,
      sections: [],
      primaryColors: [],
      fonts: [],
    };
  }

  const sections = collectSections(mjBody);

  return {
    sectionCount: sections.length,
    sections: sections.map((section, index) => ({
      index,
      columnCount: countColumns(section),
      componentTypes: getContentTypes(section),
    })),
    primaryColors: extractColors(mjBody),
    fonts: extractFonts(mjBody),
  };
}

/**
 * Formats the canvas summary into a human-readable string for inclusion in prompts.
 */
export function formatCanvasSummaryForPrompt(summary: CanvasSummary): string {
  if (summary.sectionCount === 0) {
    return 'Canvas is empty.';
  }

  const lines: string[] = [];

  lines.push(`Email has ${summary.sectionCount} section(s).`);

  for (const section of summary.sections) {
    const types =
      section.componentTypes.length > 0
        ? section.componentTypes.join(', ')
        : 'empty';
    lines.push(
      `  Section ${section.index + 1}: ${section.columnCount} column(s), contains [${types}]`,
    );
  }

  if (summary.primaryColors.length > 0) {
    lines.push(`Colors: ${summary.primaryColors.join(', ')}`);
  }

  if (summary.fonts.length > 0) {
    lines.push(`Fonts: ${summary.fonts.join(', ')}`);
  }

  return lines.join('\n');
}
