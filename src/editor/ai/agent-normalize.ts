import type { AgentScope } from './agent-types';

/**
 * Visual defaults conforming with src/editor/plugins/mjml-visual-defaults.ts
 */
const SECTION_DEFAULTS: Record<string, string> = {
  'padding-top': '20px',
  'padding-right': '0px',
  'padding-bottom': '20px',
  'padding-left': '0px',
};

const TEXT_DEFAULTS: Record<string, string> = {
  'padding-top': '10px',
  'padding-right': '0px',
  'padding-bottom': '10px',
  'padding-left': '0px',
};

const SIDE_ATTRS = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'] as const;

function hasAttr(attrs: string, attr: string): boolean {
  return new RegExp(`\\b${attr}\\s*=`, 'i').test(attrs);
}

function getAttrValue(attrs: string, attr: string): string | null {
  const match = attrs.match(
    new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? '').trim() : null;
}

function expandPaddingShorthand(
  value: string,
  defaultAttrs: Record<string, string>,
): Record<string, string> {
  const parts = value.split(/\s+/).filter(Boolean);
  const isAllZero =
    parts.length > 0 &&
    parts.every((p) => /^0(px|%|em|rem)?$/i.test(p));

  // In this builder, old padding="0px" means "missing visual defaults",
  // not "the user intentionally removed all spacing".
  if (parts.length === 0 || isAllZero) {
    return defaultAttrs;
  }

  const [top, right = top, bottom = top, left = right] = parts;

  return {
    'padding-top': top,
    'padding-right': right,
    'padding-bottom': bottom,
    'padding-left': left,
  };
}

function applyTagPaddingDefaults(
  mjml: string,
  tagName: string,
  defaultAttrs: Record<string, string>,
): string {
  const tagRegex = new RegExp(`<${tagName}(\\s+[^>]*|\\s*)>`, 'gi');

  return mjml.replace(tagRegex, (_match, attrString) => {
    const rawAttrs: string = attrString || '';

    const paddingMatch = rawAttrs.match(
      /\bpadding\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
    );
    const shorthandAttrs = paddingMatch
      ? expandPaddingShorthand(
        (
          paddingMatch[1] ??
          paddingMatch[2] ??
          paddingMatch[3] ??
          ''
        ).trim(),
        defaultAttrs,
      )
      : defaultAttrs;

    let nextAttrs = paddingMatch
      ? rawAttrs.replace(paddingMatch[0], '').trim()
      : rawAttrs.trim();

    for (const attr of SIDE_ATTRS) {
      if (hasAttr(nextAttrs, attr)) continue;

      const existingValue = getAttrValue(rawAttrs, attr);
      const value = existingValue ?? shorthandAttrs[attr] ?? defaultAttrs[attr];
      nextAttrs = `${nextAttrs}${nextAttrs ? ' ' : ''}${attr}="${value}"`;
    }

    return `<${tagName}${nextAttrs ? ` ${nextAttrs}` : ''}>`;
  });
}

function repairColumnBackgroundAttributes(mjml: string): string {
  const columnRegex = /<mj-column(\s+[^>]*|\s*)>/gi;

  return mjml.replace(columnRegex, (match, attrString) => {
    const rawAttrs: string = attrString || '';
    const containerBg = getAttrValue(rawAttrs, 'container-background-color');

    if (!containerBg) return match;

    let nextAttrs = rawAttrs
      .replace(
        /\bcontainer-background-color\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
        '',
      )
      .trim();

    if (!hasAttr(nextAttrs, 'background-color')) {
      nextAttrs = `${nextAttrs}${nextAttrs ? ' ' : ''}background-color="${containerBg}"`;
    }

    return `<mj-column${nextAttrs ? ` ${nextAttrs}` : ''}>`;
  });
}

/**
 * Repairs simple malformed structures where direct primitives live in mj-section
 * without an enclosing mj-column:
 * <mj-section><mj-text>...</mj-text></mj-section>
 * ->
 * <mj-section><mj-column><mj-text>...</mj-text></mj-column></mj-section>
 */
function repairSectionColumns(mjml: string): string {
  const sectionRegex = /<mj-section\b([^>]*)>([\s\S]*?)<\/mj-section>/gi;

  return mjml.replace(sectionRegex, (match, attrs, innerContent) => {
    // If it already has mj-column or mj-group, keep it as is
    if (/<mj-(?:column|group)\b/i.test(innerContent)) {
      return match;
    }

    // If it contains content primitives, wrap them in mj-column
    if (
      /<mj-(?:text|image|button|divider|spacer|social|navbar)\b/i.test(
        innerContent,
      )
    ) {
      return `<mj-section${attrs}>\n  <mj-column>\n${innerContent}\n  </mj-column>\n</mj-section>`;
    }

    return match;
  });
}

/**
 * Normalizes AI-generated MJML:
 * 1. Safely wraps direct section primitives in mj-column if needed.
 * 2. Applies visual padding defaults for mj-section and mj-text.
 */
export function normalizeAgentMjml(mjml: string, _scope: AgentScope): string {
  let normalized = mjml.trim();

  // 1. Repair direct content inside sections
  normalized = repairSectionColumns(normalized);

  // 2. Repair common illegal MJML attrs returned by models
  normalized = repairColumnBackgroundAttributes(normalized);

  // 3. Apply explicit visual padding defaults
  normalized = applyTagPaddingDefaults(
    normalized,
    'mj-section',
    SECTION_DEFAULTS,
  );
  normalized = applyTagPaddingDefaults(normalized, 'mj-text', TEXT_DEFAULTS);

  return normalized;
}
