import type { BlockProperties } from 'grapesjs';

/** Primitive content blocks — single MJML elements, using HTML string content
 *  as required by grapesjs-mjml's component model. */

export const textBlock: BlockProperties = {
  id: 'primitive-text',
  label: 'Text',
  category: 'Basic',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 6h16M4 12h10M4 18h14"/>
  </svg>`,
  content: `<mj-text font-size="14px" color="#333333" padding-top="10px" padding-right="0px" padding-bottom="10px" padding-left="0px">Edit your text here</mj-text>`,
};

export const headingBlock: BlockProperties = {
  id: 'primitive-heading',
  label: 'Heading',
  category: 'Basic',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 6h16M4 10h8M4 14h16M4 18h8"/>
  </svg>`,
  content: `<mj-text font-size="24px" font-weight="bold" color="#111111" padding-top="10px" padding-right="0px" padding-bottom="10px" padding-left="0px">Your Heading</mj-text>`,
};

export const imageBlock: BlockProperties = {
  id: 'primitive-image',
  label: 'Image',
  category: 'Basic',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </svg>`,
  content: `<mj-image src="https://via.placeholder.com/600x200" alt="" padding="0px"></mj-image>`,
};

export const buttonBlock: BlockProperties = {
  id: 'primitive-button',
  label: 'Button',
  category: 'Basic',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="8" width="18" height="8" rx="4"/>
    <path d="M9 12h6"/>
  </svg>`,
  content: `<mj-button href="#" background-color="#22c55e" color="#ffffff" font-size="14px" padding="0px" inner-padding="12px 28px" border-radius="4px" align="center">Click Here</mj-button>`,
};

export const dividerBlock: BlockProperties = {
  id: 'primitive-divider',
  label: 'Divider',
  category: 'Basic',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="4" y1="12" x2="20" y2="12"/>
  </svg>`,
  content: `<mj-divider border-color="#dddddd" border-style="solid" border-width="1px" padding="0px"></mj-divider>`,
};

export const spacerBlock: BlockProperties = {
  id: 'primitive-spacer',
  label: 'Spacer',
  category: 'Basic',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>
  </svg>`,
  content: `<mj-spacer height="20px"></mj-spacer>`,
};

export const primitiveBlocks: BlockProperties[] = [
  textBlock,
  headingBlock,
  imageBlock,
  buttonBlock,
  dividerBlock,
  spacerBlock,
];
