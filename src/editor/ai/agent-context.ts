import type { Component, Editor } from 'grapesjs';
import type {
  AgentRequest,
  AgentScope,
  AgentTargetContext,
  AgentTextSelectionContext,
  CanvasSummary,
  ConversationMessage,
  MentionedAsset,
} from './agent-types';
import { getMjml } from '../lib/serializer';
import { normalizeAgentMjml } from './agent-normalize';

/** Root nodes that cannot be AI targets. */
const NON_EDITABLE_TYPES = new Set(['mjml', 'mj-head', 'mj-body', 'wrapper']);

function getComponentType(component: Component): string {
  return (
    String(component.get('type') ?? '')
    || String(component.get('tagName') ?? '')
  );
}

/**
 * Walks up from a component to find the nearest mj-section ancestor.
 */
function getNearestSection(component: Component): Component | null {
  let current: Component | undefined = component;
  while (current) {
    if (current.is('mj-section')) return current;
    current = current.parent();
  }
  return null;
}

/**
 * Inline HTML nodes inside mj-text/mj-button can be selected as GrapesJS child
 * components (eg. `link`, `text`). AI should target the owning MJML text
 * component, not the inline child, otherwise the model may return a full
 * <mj-text> replacement for a nested <a>.
 */
function getNearestRichTextComponent(component: Component): Component | null {
  let current: Component | undefined = component;
  while (current) {
    if (current.is('mj-text') || current.is('mj-button')) return current;
    current = current.parent();
  }
  return null;
}

/**
 * Resolves the best AI target and scope from the current selection.
 *
 * Rules:
 * - mj-section → section scope, target is the section
 * - mj-column → section scope, target is the parent section
 * - content blocks (mj-text, mj-image, etc.) → component scope
 * - root/structural nodes → null (not editable via AI)
 */
export function resolveAgentTarget(
  selected: Component | null,
): { scope: AgentScope; target: Component } | null {
  if (!selected) return null;

  const type = getComponentType(selected);

  if (NON_EDITABLE_TYPES.has(type)) return null;

  const richTextOwner = getNearestRichTextComponent(selected);
  if (richTextOwner && richTextOwner !== selected) {
    return { scope: 'component', target: richTextOwner };
  }

  // Section itself
  if (type === 'mj-section') {
    return { scope: 'section', target: selected };
  }

  // Column — resolve up to its section
  if (type === 'mj-column' || type === 'mj-group') {
    const section = getNearestSection(selected);
    if (!section) return null;
    return { scope: 'section', target: section };
  }

  // Content block inside a column
  const section = getNearestSection(selected);
  if (!section) return null;

  return { scope: 'component', target: selected };
}

/**
 * Extracts the MJML string for a single component.
 * grapesjs-mjml components expose toHTML() which returns their MJML markup.
 */
function getComponentMjml(component: Component, scope: AgentScope): string {
  // toHTML() on grapesjs-mjml components returns the MJML tag markup
  const html = component.toHTML?.() ?? '';
  return normalizeAgentMjml(html.trim(), scope);
}

/**
 * Builds a fully typed AgentRequest from the current editor state.
 */
export function buildAgentRequest(params: {
  editor: Editor;
  scope: AgentScope;
  target: Component;
  prompt: string;
  mentionedAssets: MentionedAsset[];
  textSelection?: AgentTextSelectionContext | null;
}): AgentRequest {
  const { editor, scope, target, prompt, mentionedAssets, textSelection } = params;

  const type = getComponentType(target);
  const parentType = target.parent()
    ? getComponentType(target.parent()!)
    : undefined;

  const targetContext: AgentTargetContext = {
    id: target.getId(),
    type,
    mjml: getComponentMjml(target, scope),
    parentType,
  };

  return {
    scope,
    prompt,
    fullMjml: normalizeAgentMjml(getMjml(editor), scope),
    target: targetContext,
    textSelection,
    mentionedAssets,
  };
}

/**
 * Builds an AgentRequest for full template generation.
 * Does not require a selected target component.
 */
export function buildTemplateAgentRequest(params: {
  editor: Editor;
  prompt: string;
  mentionedAssets: MentionedAsset[];
  canvasSummary?: CanvasSummary;
  sessionContext?: string;
  conversationHistory?: ConversationMessage[];
}): AgentRequest {
  const {
    editor,
    prompt,
    mentionedAssets,
    canvasSummary,
    sessionContext,
    conversationHistory,
  } = params;

  return {
    scope: 'template',
    prompt,
    fullMjml: normalizeAgentMjml(getMjml(editor), 'template'),
    mentionedAssets,
    canvasSummary,
    sessionContext,
    conversationHistory,
  };
}
