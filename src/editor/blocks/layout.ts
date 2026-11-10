import type { Block, BlockProperties } from 'grapesjs';

export interface ColumnLayoutSpec {
  kind: 'columns' | 'column';
  ratios: number[];
  supportsInnerLayout: boolean;
}

export interface LayoutBlockProperties extends BlockProperties {
  builderLayout: ColumnLayoutSpec;
}

type BlockWithLayoutSpec = Block & {
  attributes: BlockProperties & {
    builderLayout?: ColumnLayoutSpec;
  };
};

export function getLayoutSpec(block: Block): ColumnLayoutSpec | null {
  return (block as BlockWithLayoutSpec).attributes.builderLayout ?? null;
}

/** Layout blocks — section + column scaffolding, using HTML string content
 *  as required by grapesjs-mjml's component model. */

export const oneColumnBlock: LayoutBlockProperties = {
  id: 'layout-one-column',
  label: 'One Column',
  category: 'Layout',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="16" rx="1"/>
  </svg>`,
  content: `<mj-section padding="0px">
  <mj-column padding="0px"></mj-column>
</mj-section>`,
  builderLayout: {
    kind: 'column',
    ratios: [100],
    supportsInnerLayout: false,
  },
};

export const twoColumnBlock: LayoutBlockProperties = {
  id: 'layout-two-column',
  label: 'Two Columns',
  category: 'Layout',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="8" height="16" rx="1"/>
    <rect x="13" y="4" width="8" height="16" rx="1"/>
  </svg>`,
  content: `<mj-section padding="0px">
  <mj-column width="50%" padding="0px"></mj-column>
  <mj-column width="50%" padding="0px"></mj-column>
</mj-section>`,
  builderLayout: {
    kind: 'columns',
    ratios: [50, 50],
    supportsInnerLayout: true,
  },
};

export const threeColumnBlock: LayoutBlockProperties = {
  id: 'layout-three-column',
  label: 'Three Columns',
  category: 'Layout',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="4" width="6" height="16" rx="1"/>
    <rect x="9" y="4" width="6" height="16" rx="1"/>
    <rect x="16" y="4" width="6" height="16" rx="1"/>
  </svg>`,
  content: `<mj-section padding="0px">
  <mj-column width="33.333%" padding="0px"></mj-column>
  <mj-column width="33.333%" padding="0px"></mj-column>
  <mj-column width="33.333%" padding="0px"></mj-column>
</mj-section>`,
  builderLayout: {
    kind: 'columns',
    ratios: [33.333, 33.333, 33.333],
    supportsInnerLayout: true,
  },
};

export const sidebarLayoutBlock: LayoutBlockProperties = {
  id: 'layout-sidebar',
  label: 'Sidebar Layout',
  category: 'Layout',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="5" height="16" rx="1"/>
    <rect x="10" y="4" width="11" height="16" rx="1"/>
  </svg>`,
  content: `<mj-section padding="0px">
  <mj-column width="33%" padding="0px"></mj-column>
  <mj-column width="67%" padding="0px"></mj-column>
</mj-section>`,
  builderLayout: {
    kind: 'columns',
    ratios: [33, 67],
    supportsInnerLayout: true,
  },
};

export const layoutBlocks: LayoutBlockProperties[] = [
  oneColumnBlock,
  twoColumnBlock,
  threeColumnBlock,
  sidebarLayoutBlock,
];
