import type { AgentScope } from './agent-types';

export const AI_SUPPORTED_TAGS = new Set([
  'mj-section',
  'mj-column',
  'mj-group',
  'mj-text',
  'mj-image',
  'mj-button',
  'mj-divider',
  'mj-spacer',
  'mj-social',
  'mj-social-element',
  'mj-navbar',
  'mj-navbar-link',
]);

const FORBIDDEN_TAGS = new Set([
  'script',
  'style',
  'table',
  'mj-raw',
  'iframe',
  'object',
  'embed',
  'mjml',
  'mj-head',
  'mj-body',
  'wrapper',
]);

const ALLOWED_SECTION_CHILDREN = new Set([
  'mj-column',
  'mj-group',
]);

const ALLOWED_COLUMN_CHILDREN = new Set([
  'mj-text',
  'mj-image',
  'mj-button',
  'mj-divider',
  'mj-spacer',
  'mj-social',
  'mj-navbar',
]);

const ALLOWED_COMPONENT_ROOTS = new Set([
  'mj-text',
  'mj-image',
  'mj-button',
  'mj-divider',
  'mj-spacer',
  'mj-social',
  'mj-navbar',
]);

function parseTree(mjml: string): Element {
  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available.');
  }

  const parser = new DOMParser();
  // Using text/html with a custom wrapper element
  const doc = parser.parseFromString(
    `<div id="__ai_root__">${mjml}</div>`,
    'text/html',
  );
  const root = doc.getElementById('__ai_root__');
  if (!root) {
    throw new Error('Failed to parse MJML tree structure.');
  }
  return root;
}

/**
 * Validates that candidate MJML conforms to supported tags, safe attributes,
 * and valid parent/child hierarchy.
 */
export function validateBuilderStructure(
  mjml: string,
  scope: AgentScope,
): void {
  const trimmed = mjml.trim();
  if (!trimmed) {
    throw new Error('MJML snippet cannot be empty.');
  }

  const root = parseTree(trimmed);
  const topElements = Array.from(root.children);

  if (topElements.length === 0) {
    throw new Error('No valid HTML/MJML elements found in AI response.');
  }

  // 1. Check scope-level roots
  if (scope === 'component') {
    if (topElements.length !== 1) {
      throw new Error(
        `Component scope requires exactly 1 root element, but found ${topElements.length}.`,
      );
    }
    const rootTag = topElements[0].tagName.toLowerCase();
    if (!ALLOWED_COMPONENT_ROOTS.has(rootTag)) {
      throw new Error(
        `Invalid component root tag <${rootTag}>. Expected a content component (e.g. mj-text, mj-image, mj-button).`,
      );
    }
  } else if (scope === 'section') {
    if (topElements.length !== 1) {
      throw new Error(
        `Section scope requires exactly 1 root element, but found ${topElements.length}.`,
      );
    }
    const rootTag = topElements[0].tagName.toLowerCase();
    if (rootTag !== 'mj-section') {
      throw new Error(
        `Invalid section root tag <${rootTag}>. Expected <mj-section>.`,
      );
    }
  }

  // 2. Global scan of all elements for forbidden tags and unsafe attributes
  const allElements = Array.from(root.querySelectorAll('*'));
  for (const el of allElements) {
    const tagName = el.tagName.toLowerCase();

    if (FORBIDDEN_TAGS.has(tagName)) {
      throw new Error(
        `Security/structure violation: <${tagName}> is not allowed in AI generated emails.`,
      );
    }

    // Check attributes
    for (const attr of Array.from(el.attributes)) {
      const attrName = attr.name.toLowerCase();
      const attrVal = attr.value.trim().toLowerCase();

      // No event handlers
      if (attrName.startsWith('on')) {
        throw new Error(
          `Security violation: Event handler attribute "${attr.name}" on <${tagName}> is not allowed.`,
        );
      }

      // No editor-internal attributes
      if (attrName.startsWith('builder') || attrName.startsWith('data-ai')) {
        throw new Error(
          `Invalid attribute: Editor-internal attribute "${attr.name}" on <${tagName}> is not allowed.`,
        );
      }

      // No javascript: URLs
      if (
        (attrName === 'href' || attrName === 'src' || attrName === 'action') &&
        attrVal.startsWith('javascript:')
      ) {
        throw new Error(
          `Security violation: "javascript:" URL in "${attr.name}" is not allowed.`,
        );
      }
    }
  }

  // 3. Hierarchy validation
  for (const el of allElements) {
    const tagName = el.tagName.toLowerCase();

    // Inside mj-text, children are rich text HTML, so we don't enforce MJML hierarchy on them
    let ancestor = el.parentElement;
    let insideMjText = false;
    while (ancestor && ancestor !== root) {
      if (ancestor.tagName.toLowerCase() === 'mj-text') {
        insideMjText = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    if (insideMjText) {
      continue;
    }

    // Top-level MJML elements must be supported tags
    if (!AI_SUPPORTED_TAGS.has(tagName)) {
      throw new Error(
        `Unsupported MJML element: <${tagName}> is not supported by the builder.`,
      );
    }

    // Check children of mj-section
    if (tagName === 'mj-section') {
      for (const child of Array.from(el.children)) {
        const childTag = child.tagName.toLowerCase();
        if (!ALLOWED_SECTION_CHILDREN.has(childTag)) {
          throw new Error(
            `<mj-section> cannot directly contain <${childTag}>. Allowed children are <mj-column> or <mj-group>.`,
          );
        }
      }
    }

    // Check children of mj-group
    if (tagName === 'mj-group') {
      for (const child of Array.from(el.children)) {
        const childTag = child.tagName.toLowerCase();
        if (childTag !== 'mj-column') {
          throw new Error(
            `<mj-group> cannot contain <${childTag}>. Only <mj-column> is allowed inside <mj-group>.`,
          );
        }
      }
    }

    // Check children of mj-column
    if (tagName === 'mj-column') {
      for (const child of Array.from(el.children)) {
        const childTag = child.tagName.toLowerCase();
        if (!ALLOWED_COLUMN_CHILDREN.has(childTag)) {
          throw new Error(
            `<mj-column> cannot contain <${childTag}>. Expected a content component (e.g. mj-text, mj-image).`,
          );
        }
      }
    }
  }
}
