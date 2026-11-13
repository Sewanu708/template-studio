import type { AgentScope } from './agent-types';

/**
 * Repairable validation error thrown when AI output contains hidden/uneditable styling.
 * These errors can trigger a single retry with a repair prompt.
 */
export class AgentRepairableValidationError extends Error {
  repairReasons: string[];

  constructor(message: string, repairReasons: string[]) {
    super(message);
    this.name = 'AgentRepairableValidationError';
    this.repairReasons = repairReasons;
  }
}

/**
 * Type guard for AgentRepairableValidationError.
 */
export function isRepairableAgentError(
  err: unknown,
): err is AgentRepairableValidationError {
  return err instanceof AgentRepairableValidationError;
}

/**
 * Patterns that trigger a repair retry.
 * Each pattern has a regex and a human-readable reason for the repair prompt.
 */
const HIDDEN_STYLE_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
}> = [
  {
    pattern: /<mj-attributes\b/i,
    reason: 'Do not use <mj-attributes>; write styles directly on body components.',
  },
  {
    pattern: /<mj-all\b/i,
    reason: 'Do not use <mj-all>; write styles directly on body components.',
  },
  {
    pattern: /<mj-class\b/i,
    reason: 'Do not use <mj-class>; class-based styling is not editable in the builder.',
  },
  {
    pattern: /\bmj-class\s*=\s*["'][^"']+["']/i,
    reason: 'Do not use mj-class="..."; class-based inherited styling is not editable.',
  },
  {
    pattern: /<mj-style\b/i,
    reason: 'Do not use <mj-style>; custom CSS is not editable in the builder.',
  },
  {
    pattern: /\bcss-class\s*=\s*["'][^"']+["']/i,
    reason: 'Do not use css-class="..."; class-based styling is not editable in the builder.',
  },
  {
    pattern: /<mj-html-attributes\b/i,
    reason: 'Do not use <mj-html-attributes>; hidden HTML mutations are not supported.',
  },
  {
    pattern: /<mj-raw\b/i,
    reason: 'Do not use <mj-raw>; raw/uncontrolled markup is not safe for the builder.',
  },
  {
    pattern: /<style\b[^>]*>/i,
    reason: 'Do not use <style> tags; raw CSS is not editable in the builder.',
  },
  {
    pattern: /\blinear-gradient\s*\(/i,
    reason: 'Do not use linear-gradient(); gradients are not editor-safe as MJML component styling.',
  },
  {
    pattern: /\bbox-shadow\s*:/i,
    reason: 'Do not use box-shadow; it is not represented by the MJML inspector model.',
  },
  {
    pattern: /\btransform\s*:/i,
    reason: 'Do not use CSS transform; it is not email-builder-safe.',
  },
  {
    pattern: /:hover\s*\{/i,
    reason: 'Do not use :hover; stateful CSS is not supported by component attributes.',
  },
  {
    pattern: /@media\s*[\(\{]/i,
    reason: 'Do not use @media; responsive CSS is outside the component model.',
  },
];

/**
 * Patterns for inline style attributes on MJML body tags.
 * style="..." on MJML tags introduces hidden CSS outside the inspector model.
 */
const INLINE_STYLE_PATTERN = /<mj-[a-z0-9-]+[^>]*\bstyle\s*=\s*["'][^"']+["'][^>]*>/i;

/**
 * Checks whether the mj-head element is empty.
 * Returns true if mj-head exists and is not empty (contains child elements or non-whitespace text).
 */
function hasNonEmptyMjHead(mjml: string): boolean {
  // Match <mj-head>...</mj-head> and check if content is non-empty
  const headMatch = mjml.match(/<mj-head\b[^>]*>([\s\S]*?)<\/mj-head>/i);
  if (!headMatch) {
    return false;
  }
  const headContent = headMatch[1].trim();
  // Empty head is valid; anything else is not
  return headContent.length > 0;
}

/**
 * Validates that MJML output does not contain hidden/uneditable styling.
 * Throws AgentRepairableValidationError if violations are found.
 *
 * @param mjml - The normalized MJML string to validate
 * @param scope - The agent scope (template, section, component)
 */
export function validateNoHiddenTemplateStyling(
  mjml: string,
  scope: AgentScope,
): void {
  const repairReasons: string[] = [];

  // For template scope, mj-head must be empty
  if (scope === 'template' && hasNonEmptyMjHead(mjml)) {
    repairReasons.push('Template <mj-head> must be empty.');
  }

  // For non-template scopes, mj-head should not exist at all
  if (scope !== 'template' && /<mj-head\b/i.test(mjml)) {
    repairReasons.push('<mj-head> is only allowed in template scope.');
  }

  // Check all hidden style patterns
  for (const { pattern, reason } of HIDDEN_STYLE_PATTERNS) {
    if (pattern.test(mjml)) {
      repairReasons.push(reason);
    }
  }

  // Check for inline style attributes on MJML tags
  // We need to be careful: style inside mj-text content is allowed (for inline HTML)
  // but style="..." on the MJML tags themselves is not
  if (hasInlineStyleOnMjmlTags(mjml)) {
    repairReasons.push(
      'Do not use style="..." on MJML body tags; hidden CSS is outside the inspector model.',
    );
  }

  if (repairReasons.length > 0) {
    throw new AgentRepairableValidationError(
      'AI output contains hidden or unsupported styling that cannot be edited in the builder.',
      repairReasons,
    );
  }
}

/**
 * Checks if any MJML tag (not HTML inside mj-text) has a style attribute.
 */
function hasInlineStyleOnMjmlTags(mjml: string): boolean {
  // Remove mj-text content to avoid false positives from inline HTML
  const withoutMjTextContent = mjml.replace(
    /<mj-text\b[^>]*>[\s\S]*?<\/mj-text>/gi,
    '<mj-text></mj-text>',
  );

  // Also remove mj-button content (can contain inline HTML)
  const cleaned = withoutMjTextContent.replace(
    /<mj-button\b[^>]*>[\s\S]*?<\/mj-button>/gi,
    '<mj-button></mj-button>',
  );

  return INLINE_STYLE_PATTERN.test(cleaned);
}

/**
 * User-friendly error message for when repair fails.
 */
export const REPAIR_FAILURE_USER_MESSAGE =
  "I couldn't safely apply that design because it used advanced web styling that does not translate reliably into editable email components. Try asking for a simpler email-safe version, or use an image background for effects like gradients.";
