import type { Plugin } from 'grapesjs';
import { primitiveBlocks } from '../blocks/primitive';
import { layoutBlocks } from '../blocks/layout';
import { compositionBlocks } from '../blocks/composition';

/**
 * Core email builder plugin.
 * Registers all approved blocks and enforces the MJML component model.
 * Third-party defaults (grapesjs-mjml) provide the canvas rendering;
 * this plugin owns what the user can build and how.
 */
export const emailBuilderPlugin: Plugin = (editor) => {
  const blocks = editor.Blocks;
  const allBlocks = [...primitiveBlocks, ...layoutBlocks, ...compositionBlocks];

  allBlocks.forEach((block) => blocks.add(block.id!, block));

  editor.onReady(() => {
    const root = editor.getWrapper();
    if (!root) return;
    [root, ...root.findType('mjml'), ...root.findType('mj-head'), ...root.findType('mj-body')]
      .forEach((component) => {
        component.set({ removable: false, copyable: false, draggable: false });
      });
  });
};
