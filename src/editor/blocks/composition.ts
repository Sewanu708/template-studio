import type { BlockProperties } from 'grapesjs';

/** Composition blocks — pre-assembled multi-element sections, using HTML string
 *  content as required by grapesjs-mjml's component model. */

export const heroBlock: BlockProperties = {
  id: 'composition-hero',
  label: 'Hero',
  category: 'Marketing',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="3" width="20" height="13" rx="1"/>
    <path d="M8 21l4-4 4 4"/>
  </svg>`,
  content: `<mj-section background-color="#f4f4f4" padding="40px 0">
  <mj-column padding="0px">
    <mj-image src="https://placehold.co/600x300" alt="Hero image" padding="0"></mj-image>
    <mj-text font-size="28px" font-weight="bold" align="center" padding="20px 25px 10px">Your Headline Here</mj-text>
    <mj-text font-size="16px" align="center" color="#666666" padding="0 25px 20px">A short supporting line to reinforce your headline.</mj-text>
    <mj-button href="#" background-color="#22c55e" color="#ffffff" font-size="16px" padding="0px" inner-padding="14px 32px" border-radius="4px" align="center">Get Started</mj-button>
  </mj-column>
</mj-section>`,
};

export const callToActionBlock: BlockProperties = {
  id: 'composition-cta',
  label: 'Call to Action',
  category: 'Marketing',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>`,
  content: `<mj-section background-color="#22c55e" padding="32px 0">
  <mj-column padding="0px">
    <mj-text font-size="22px" font-weight="bold" align="center" color="#ffffff" padding="0 25px 12px">Don't miss out!</mj-text>
    <mj-button href="#" background-color="#ffffff" color="#22c55e" font-size="15px" padding="0px" inner-padding="12px 28px" border-radius="4px" align="center">Take Action Now</mj-button>
  </mj-column>
</mj-section>`,
};

export const footerBlock: BlockProperties = {
  id: 'composition-footer',
  label: 'Footer',
  category: 'Marketing',
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 18h16M4 14h16M4 10h8"/>
  </svg>`,
  content: `<mj-section background-color="#f8f8f8" padding="20px 0">
  <mj-column padding="0px">
    <mj-divider border-color="#dddddd" border-width="1px" padding="0 0 20px"></mj-divider>
    <mj-text font-size="12px" color="#999999" align="center" padding="0 25px 8px">© Your Company. All rights reserved.</mj-text>
    <mj-text font-size="12px" color="#999999" align="center" padding="0 25px 8px">123 Street, City, Country</mj-text>
    <mj-text font-size="12px" color="#999999" align="center" padding="0 25px"><a href="#" style="color:#999999;">Unsubscribe</a> | <a href="#" style="color:#999999;">Privacy Policy</a></mj-text>
  </mj-column>
</mj-section>`,
};

export const compositionBlocks: BlockProperties[] = [
  heroBlock,
  callToActionBlock,
  footerBlock,
];
