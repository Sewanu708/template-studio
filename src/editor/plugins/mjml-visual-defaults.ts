import type { Component, Plugin } from 'grapesjs';

/**
 * Ensures the MJML component model explicitly contains the spacing values
 * that the canvas displays — so canvas visual spacing = MJML attrs =
 * browser preview/export.
 *
 * Problem this solves:
 *   MJML has built-in defaults (mj-section: 20px 0, mj-text: 10px 25px).
 *   The canvas iframe renders those defaults visually. When the builder
 *   emits padding="0px" or no padding at all, the HTML compiler obeys that
 *   and strips the spacing — so preview loses what the canvas showed.
 *
 * Rules:
 *   1. If a component already has any side-specific padding attr
 *      (padding-top / padding-right / padding-bottom / padding-left),
 *      treat it as intentionally set — do not touch it.
 *   2. If a component has the old bad shorthand padding="0px", convert it
 *      to explicit builder defaults for the affected component types.
 *   3. If a component has no padding attrs at all, apply builder defaults.
 *   4. Mark normalized components with a GrapesJS model prop so the
 *      normalization only runs once per component instance.
 *   5. Never write builderVisualDefaultsApplied into MJML attributes.
 */

const MARKER = 'builderVisualDefaultsApplied';

/** Builder visual defaults — explicit side attrs, no shorthand. */
const DEFAULTS: Record<string, Record<string, string>> = {
  'mj-section': {
    'padding-top': '20px',
    'padding-right': '0px',
    'padding-bottom': '20px',
    'padding-left': '0px',
  },
  'mj-text': {
    'padding-top': '10px',
    'padding-right': '0px',
    'padding-bottom': '10px',
    'padding-left': '0px',
  },
};

const SUPPORTED_TYPES = new Set(Object.keys(DEFAULTS));

/** Side-specific padding attribute names. */
const SIDE_ATTRS = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'] as const;

function getComponentType(component: Component): string {
  return (
    String(component.get('type') ?? '')
    || String(component.get('tagName') ?? '')
  );
}

function hasSideSpecificPadding(attrs: Record<string, string>): boolean {
  return SIDE_ATTRS.some((attr) => attr in attrs);
}

function hasZeroShorthandOnly(attrs: Record<string, string>): boolean {
  // Matches padding="0px", padding="0", padding="0px 0px", etc. — anything
  // that evaluates to fully-zero and is the only padding attr present.
  if (hasSideSpecificPadding(attrs)) return false;
  if (!('padding' in attrs)) return false;

  const val = attrs['padding']?.trim() ?? '';
  // Split the shorthand and check every part is zero.
  const parts = val.split(/\s+/).filter(Boolean);
  return (
    parts.length > 0
    && parts.every((p) => p === '0' || p === '0px' || p === '0%' || p === '0em' || p === '0rem')
  );
}

function hasNoPaddingAttrs(attrs: Record<string, string>): boolean {
  return !('padding' in attrs) && !hasSideSpecificPadding(attrs);
}

function normalizeComponent(component: Component, editor: Parameters<Plugin>[0]): void {
  const type = getComponentType(component);
  if (!SUPPORTED_TYPES.has(type)) return;

  // Already normalized this instance — skip.
  if (component.get(MARKER)) return;

  const attrs = component.getAttributes() as Record<string, string>;
  const defaults = DEFAULTS[type]!;

  const shouldApply = hasNoPaddingAttrs(attrs) || hasZeroShorthandOnly(attrs);
  if (!shouldApply) {
    // Even if we don't change anything, mark it so we don't re-evaluate.
    component.set(MARKER, true);
    return;
  }

  editor.UndoManager.skip(() => {
    // Remove the zero shorthand if present.
    if ('padding' in attrs) {
      component.removeAttributes('padding');
    }
    // Apply builder defaults as explicit side attrs.
    component.addAttributes(defaults);
    component.set(MARKER, true);

    // Repaint: for mj-text the padding lives on the parent column's wrapper
    // td, so we need the parent view to re-render as well.
    component.view?.render();
    const parent = component.parent();
    if (parent?.is('mj-column') || parent?.is('mj-section')) {
      parent.view?.render();
    }
  });
}

function normalizeAll(editor: Parameters<Plugin>[0]): void {
  const root = editor.getWrapper();
  if (!root) return;

  SUPPORTED_TYPES.forEach((type) => {
    root.findType(type).forEach((component: Component) => {
      normalizeComponent(component, editor);
    });
  });
}

export const mjmlVisualDefaultsPlugin: Plugin = (editor) => {
  // Normalize on component add (new blocks dragged in).
  editor.on('component:add', (component: Component) => {
    normalizeComponent(component, editor);
  });

  // Normalize all existing components after the editor finishes loading.
  editor.on('load', () => {
    normalizeAll(editor);
  });

  // Also normalize when a saved project JSON is loaded into an already-
  // initialized editor (e.g. loading a template after first boot).
  editor.on('project:load', () => {
    normalizeAll(editor);
  });
};
