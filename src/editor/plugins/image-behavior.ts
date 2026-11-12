import type { Component, Plugin } from 'grapesjs';

interface BoxSides {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

function isMjImage(component: Component): boolean {
  return (
    component.is('mj-image')
    || component.get('type') === 'mj-image'
    || component.get('tagName') === 'mj-image'
  );
}

function normalizeImageSizing(component: Component): void {
  if (!isMjImage(component)) return;

  const attrs = component.getAttributes() as Record<string, string>;
  const shouldRemoveHeight = 'height' in attrs;
  const shouldRemoveForcedFullWidth = attrs.width === '100%';
  const shouldExpandPadding = 'padding' in attrs;

  if (!shouldRemoveHeight && !shouldRemoveForcedFullWidth && !shouldExpandPadding) return;

  const attrsToRemove: string[] = [];
  const attrsToAdd: Record<string, string> = {};

  if (shouldRemoveHeight) attrsToRemove.push('height');
  if (shouldRemoveForcedFullWidth) attrsToRemove.push('width');
  if (shouldExpandPadding) {
    const sides = parsePadding(attrs.padding);

    attrsToRemove.push('padding');
    attrsToAdd['padding-top'] = sides.top;
    attrsToAdd['padding-right'] = sides.right;
    attrsToAdd['padding-bottom'] = sides.bottom;
    attrsToAdd['padding-left'] = sides.left;
  }

  if (attrsToRemove.length) component.removeAttributes(attrsToRemove);
  if (Object.keys(attrsToAdd).length) component.addAttributes(attrsToAdd);
}

function parsePadding(value: string | undefined): BoxSides {
  const parts = String(value ?? '0px').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    const side = normalizePaddingPart(parts[0]);
    return { top: side, right: side, bottom: side, left: side };
  }

  if (parts.length === 2) {
    const vertical = normalizePaddingPart(parts[0]);
    const horizontal = normalizePaddingPart(parts[1]);

    return {
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal,
    };
  }

  if (parts.length === 3) {
    const top = normalizePaddingPart(parts[0]);
    const horizontal = normalizePaddingPart(parts[1]);
    const bottom = normalizePaddingPart(parts[2]);

    return {
      top,
      right: horizontal,
      bottom,
      left: horizontal,
    };
  }

  if (parts.length >= 4) {
    return {
      top: normalizePaddingPart(parts[0]),
      right: normalizePaddingPart(parts[1]),
      bottom: normalizePaddingPart(parts[2]),
      left: normalizePaddingPart(parts[3]),
    };
  }

  return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
}

function normalizePaddingPart(value: string | undefined): string {
  const trimmed = String(value ?? '').trim();

  if (!trimmed || trimmed === '0') return '0px';
  if (/^-?\d*\.?\d+(px|%|em|rem)$/i.test(trimmed)) return trimmed;
  if (/^-?\d*\.?\d+$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

/**
 * Keeps image sizing simple for non-technical users.
 *
 * Images are controlled by width only when the user chooses to resize them.
 * New images should keep their natural display size, capped by the email
 * container. Persisted height attributes and old forced `width="100%"`
 * defaults are removed from added, loaded, or updated image components.
 */
export const imageBehaviorPlugin: Plugin = (editor) => {
  const sanitizeImage = (component: Component) => {
    editor.UndoManager.skip(() => normalizeImageSizing(component));
  };

  editor.onReady(() => {
    editor.getWrapper()?.findType('mj-image').forEach(sanitizeImage);
  });

  editor.on('component:add component:update', (component: Component) => {
    sanitizeImage(component);
  });
};
