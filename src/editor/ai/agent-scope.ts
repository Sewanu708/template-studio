import type { AgentRequest, AgentResponse } from './agent-types';

export interface MjmlRootInfo {
  tagName: string;
  attrs: Record<string, string>;
}

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrStr)) !== null) {
    const key = match[1].toLowerCase();
    const val =
      match[2] !== undefined
        ? match[2]
        : match[3] !== undefined
          ? match[3]
          : match[4] !== undefined
            ? match[4]
            : '';
    attrs[key] = val;
  }
  return attrs;
}

/**
 * Extracts top-level root MJML elements from a markup string.
 * Skips comments, respects self-closing tags and nested tags.
 */
export function extractMjmlRoots(mjml: string): MjmlRootInfo[] {
  const str = mjml.trim();
  if (!str) return [];

  const roots: MjmlRootInfo[] = [];
  let index = 0;

  while (index < str.length) {
    // Skip whitespace
    while (index < str.length && /\s/.test(str[index])) index++;
    if (index >= str.length) break;

    // Check for comments
    if (str.startsWith('<!--', index)) {
      const closeIdx = str.indexOf('-->', index + 4);
      if (closeIdx === -1) break;
      index = closeIdx + 3;
      continue;
    }

    if (str[index] !== '<') {
      // Non-tag text found at root
      roots.push({ tagName: '#text', attrs: {} });
      break;
    }

    // Match start tag: <([a-zA-Z0-9_-]+)
    const tagMatch = str
      .slice(index)
      .match(
        /^<([a-zA-Z0-9_-]+)((?:\s+[a-zA-Z0-9_-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/,
      );

    if (!tagMatch) {
      roots.push({ tagName: '#invalid', attrs: {} });
      break;
    }

    const [fullMatch, tagName, attrStr, isSelfClosing] = tagMatch;
    const attrs = parseAttrs(attrStr);
    const tagLower = tagName.toLowerCase();

    if (isSelfClosing === '/') {
      roots.push({ tagName: tagLower, attrs });
      index += fullMatch.length;
      continue;
    }

    // It's an open tag. Find corresponding </tagName>
    const openTag = tagLower;
    let depth = 1;
    const tagRegex = /<(\/?)\s*([a-zA-Z0-9_-]+)(?:\s+[^>]*)?(\/?)\s*>/g;
    tagRegex.lastIndex = index + fullMatch.length;

    let endIdx = -1;
    let nextMatch: RegExpExecArray | null;

    while ((nextMatch = tagRegex.exec(str)) !== null) {
      const isClosing = nextMatch[1] === '/';
      const tName = nextMatch[2].toLowerCase();
      const isSelf = nextMatch[3] === '/';

      if (tName === openTag) {
        if (isClosing) {
          depth--;
          if (depth === 0) {
            endIdx = tagRegex.lastIndex;
            break;
          }
        } else if (!isSelf) {
          depth++;
        }
      }
    }

    roots.push({ tagName: tagLower, attrs });

    if (depth !== 0 || endIdx === -1) {
      break;
    }

    index = endIdx;
  }

  return roots;
}

/**
 * Validates that the AI response matches the requested scope and has valid root elements.
 * Throws descriptive errors if scope mismatch or invalid root is detected.
 */
export function validateAgentScope(
  response: AgentResponse,
  request: AgentRequest,
): void {
  if (response.type === 'answer') {
    return;
  }

  if (response.targetId !== request.target.id) {
    throw new Error(
      `AI response targetId "${response.targetId}" does not match current target "${request.target.id}".`,
    );
  }

  if (request.scope === 'component') {
    if (response.type !== 'replace-component') {
      throw new Error(
        `Cannot apply section response (${response.type}) to a component-level edit. Expected "replace-component".`,
      );
    }

    if (!request.target.type.startsWith('mj-')) {
      throw new Error(
        `Component AI target must be an MJML component, but received "${request.target.type}".`,
      );
    }

    const roots = extractMjmlRoots(response.mjml);
    if (roots.length === 0) {
      throw new Error('Component response snippet is empty or missing tags.');
    }

    if (roots.length > 1) {
      throw new Error(
        `Component response must have exactly 1 root element, but found ${roots.length}.`,
      );
    }

    const rootTag = roots[0].tagName;
    if (rootTag === 'mj-section') {
      throw new Error(
        'Component response cannot return an <mj-section>. Target is inside a section.',
      );
    }

    if (
      rootTag === 'mjml' ||
      rootTag === 'mj-head' ||
      rootTag === 'mj-body' ||
      rootTag === 'wrapper'
    ) {
      throw new Error(
        `Component response cannot return root <${rootTag}>. Target is a single content component.`,
      );
    }

    if (rootTag.startsWith('#')) {
      throw new Error('Component response must be a valid MJML component tag.');
    }
    return;
  }

  if (request.scope === 'section') {
    if (response.type !== 'replace-section') {
      throw new Error(
        `Cannot apply component response (${response.type}) to a section-level edit. Expected "replace-section".`,
      );
    }

    const roots = extractMjmlRoots(response.mjml);
    if (roots.length === 0) {
      throw new Error('Section response snippet is empty or missing tags.');
    }

    if (roots.length !== 1 || roots[0].tagName !== 'mj-section') {
      const summary =
        roots.length === 1
          ? `<${roots[0].tagName}>`
          : `${roots.length} root elements (${roots.map((r) => r.tagName).join(', ')})`;
      throw new Error(
        `Section response must return exactly one <mj-section>, but received ${summary}.`,
      );
    }
    return;
  }

  if (request.scope === 'text-selection') {
    if (response.type !== 'replace-text-selection') {
      throw new Error(
        `Cannot apply non-selection response (${response.type}) to a text-selection edit. Expected "replace-text-selection".`,
      );
    }

    if (!response.targetId.trim()) {
      throw new Error('Text-selection response missing a valid targetId.');
    }

    if (!response.replacementHtml.trim()) {
      throw new Error('Text-selection response replacementHtml cannot be empty.');
    }
  }
}
