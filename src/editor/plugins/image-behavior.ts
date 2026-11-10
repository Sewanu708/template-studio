import type { Component, Plugin } from 'grapesjs';

function isMjImage(component: Component): boolean {
  return (
    component.is('mj-image')
    || component.get('type') === 'mj-image'
    || component.get('tagName') === 'mj-image'
  );
}

function removeImageHeight(component: Component): void {
  if (!isMjImage(component)) return;

  const attrs = component.getAttributes() as Record<string, string>;
  if (!('height' in attrs)) return;

  const nextAttrs = { ...attrs };
  delete nextAttrs.height;
  component.set('attributes', nextAttrs);
}

/**
 * Keeps image sizing simple for non-technical users.
 *
 * Images are controlled by width only. MJML/email clients preserve the
 * original image aspect ratio, so persisted height attributes are removed
 * from added, loaded, or updated image components.
 */
export const imageBehaviorPlugin: Plugin = (editor) => {
  const sanitizeImage = (component: Component) => {
    editor.UndoManager.skip(() => removeImageHeight(component));
  };

  editor.onReady(() => {
    editor.getWrapper()?.findType('mj-image').forEach(sanitizeImage);
  });

  editor.on('component:add component:update', (component: Component) => {
    sanitizeImage(component);
  });
};
