import type { Component, Plugin } from 'grapesjs';

const COLUMN_WRAPPED_CHILD_TYPES = new Set([
  'mj-accordion',
  'mj-button',
  'mj-carousel',
  'mj-divider',
  'mj-image',
  'mj-navbar',
  'mj-social',
  'mj-spacer',
  'mj-table',
  'mj-text',
]);

const WRAPPER_RENDER_ATTRS = [
  'align',
  'css-class',
  'container-background-color',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
];

function getComponentType(component: Component): string {
  return (
    component.get('type')
    || component.get('tagName')
    || ''
  );
}

function hasWrapperRenderAttrs(component: Component): boolean {
  const attrs = component.getAttributes() as Record<string, string>;
  return WRAPPER_RENDER_ATTRS.some((attr) => attr in attrs);
}

function isColumnWrappedChild(component: Component): boolean {
  return COLUMN_WRAPPED_CHILD_TYPES.has(getComponentType(component));
}

/**
 * Keeps GrapesJS' canvas in sync with MJML's parent-rendered child wrappers.
 *
 * In MJML, children inside mj-column don't render their own outer spacing.
 * The parent mj-column renders each child inside a wrapper `<td>` and applies
 * child attributes like padding, align, css-class, and container background to
 * that wrapper. Updating the child alone therefore doesn't always repaint the
 * visible canvas wrapper. Re-rendering the parent column after those child
 * attribute changes makes the canvas match the exported MJML.
 */
export const mjmlRenderRefreshPlugin: Plugin = (editor) => {
  const queuedParents = new Set<Component>();
  let frame = 0;

  const flush = () => {
    frame = 0;
    const selected = editor.getSelected();

    queuedParents.forEach((parent) => {
      parent.view?.render();
    });
    queuedParents.clear();

    if (selected) {
      requestAnimationFrame(() => editor.select(selected));
    }
  };

  const queueParentRender = (component: Component) => {
    const parent = component.parent();
    if (!parent?.is('mj-column')) return;
    if (!isColumnWrappedChild(component)) return;
    if (!hasWrapperRenderAttrs(component)) return;

    queuedParents.add(parent);
    if (!frame) frame = requestAnimationFrame(flush);
  };

  editor.on('component:update:attributes', queueParentRender);
};
