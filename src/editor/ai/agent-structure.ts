import type { AgentScope } from './agent-types';

export const AI_SUPPORTED_TAGS = new Set([
  'mj-section',
  'mj-column',
  'mj-group',
  'mj-wrapper',
  'mj-hero',
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
  'mj-style',
  'mj-raw',
  'iframe',
  'object',
  'embed',
]);

// Tags forbidden in component/section scope but allowed in template scope
const ROOT_ONLY_TAGS = new Set([
  'mjml',
  'mj-head',
  'mj-body',
  'wrapper',
]);

const TEMPLATE_ROOT_TAGS = new Set([
  'mjml',
  'mj-head',
  'mj-body',
]);

const ALLOWED_MJML_CHILDREN = new Set([
  'mj-head',
  'mj-body',
]);

const ALLOWED_BODY_CHILDREN = new Set([
  'mj-section',
  'mj-wrapper',
  'mj-hero',
]);

const ALLOWED_SECTION_CHILDREN = new Set([
  'mj-column',
  'mj-group',
]);

const ALLOWED_WRAPPER_CHILDREN = new Set([
  'mj-section',
  'mj-hero',
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
  if (scope === 'template') {
    if (topElements.length !== 1) {
      throw new Error(
        `Template scope requires exactly 1 root element, but found ${topElements.length}.`,
      );
    }
    const rootTag = topElements[0].tagName.toLowerCase();
    if (rootTag !== 'mjml') {
      throw new Error(
        `Invalid template root tag <${rootTag}>. Expected <mjml>.`,
      );
    }

    // Template must contain mj-body
    const mjBody = root.querySelector('mj-body');
    if (!mjBody) {
      throw new Error(
        'Template must contain <mj-body>.',
      );
    }

    const mjHead = root.querySelector('mj-head');
    if (mjHead && mjHead.children.length > 0) {
      throw new Error(
        'Template <mj-head> must be empty. Put all editable styling directly on body components.',
      );
    }

    // Template must contain at least one mj-section
    const sections = root.querySelectorAll('mj-section');
    if (sections.length === 0) {
      throw new Error(
        'Template must contain at least one <mj-section>.',
      );
    }
  } else if (scope === 'component') {
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

    // Root-only tags forbidden in non-template scopes
    if (scope !== 'template' && ROOT_ONLY_TAGS.has(tagName)) {
      throw new Error(
        `Structure violation: <${tagName}> is only allowed in template scope.`,
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
    let insideMjHead = false;
    while (ancestor && ancestor !== root) {
      const ancestorTag = ancestor.tagName.toLowerCase();
      if (ancestorTag === 'mj-text') {
        insideMjText = true;
        break;
      }
      if (ancestorTag === 'mj-head') {
        insideMjHead = true;
      }
      ancestor = ancestor.parentElement;
    }
    if (insideMjText) {
      continue;
    }

    // In full-template scope, mj-head can contain MJML head configuration tags
    // like mj-attributes/mj-all/mj-class. They are still covered by the global
    // security scan above, but they don't follow body component hierarchy rules.
    if (scope === 'template' && insideMjHead) {
      continue;
    }

    if (scope === 'template' && TEMPLATE_ROOT_TAGS.has(tagName)) {
      if (tagName === 'mjml') {
        for (const child of Array.from(el.children)) {
          const childTag = child.tagName.toLowerCase();
          if (!ALLOWED_MJML_CHILDREN.has(childTag)) {
            throw new Error(
              `<mjml> cannot directly contain <${childTag}>. Allowed children are <mj-head> and <mj-body>.`,
            );
          }
        }
      }

      if (tagName === 'mj-body') {
        for (const child of Array.from(el.children)) {
          const childTag = child.tagName.toLowerCase();
          if (!ALLOWED_BODY_CHILDREN.has(childTag)) {
            throw new Error(
              `<mj-body> cannot directly contain <${childTag}>. Expected <mj-section>, <mj-wrapper>, or <mj-hero>.`,
            );
          }
        }
      }

      continue;
    }

    // Body MJML elements must be supported tags
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

    // Check children of mj-wrapper
    if (tagName === 'mj-wrapper') {
      for (const child of Array.from(el.children)) {
        const childTag = child.tagName.toLowerCase();
        if (!ALLOWED_WRAPPER_CHILDREN.has(childTag)) {
          throw new Error(
            `<mj-wrapper> cannot directly contain <${childTag}>. Expected <mj-section> or <mj-hero>.`,
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
