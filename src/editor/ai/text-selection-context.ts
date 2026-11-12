import type { Component, Editor } from 'grapesjs';
import type { AgentTextSelectionContext } from './agent-types';

const INLINE_TAGS = new Set([
  'b',
  'strong',
  'em',
  'i',
  'u',
  'span',
  'a',
  'br',
  'p',
]);

const INLINE_STYLES = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
]);

export interface CapturedTextSelection {
  component: Component;
  range: Range;
  contentElement: HTMLElement;
  beforeHtml: string;
  context: AgentTextSelectionContext;
}

export function sanitizeInlineHtml(html: string): string {
  if (!html) return '';

  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (!INLINE_TAGS.has(tag)) {
        const replacement = document.createTextNode(element.textContent ?? '');
        element.replaceWith(replacement);
        return;
      }

      for (const attr of Array.from(element.attributes)) {
        const name = attr.name.toLowerCase();
        if (name === 'href') {
          const value = attr.value.trim();
          if (!/^https?:\/\//i.test(value) && !value.startsWith('#') && !/^mailto:/i.test(value)) {
            element.removeAttribute(attr.name);
          }
          continue;
        }

        if (name === 'target') {
          const value = attr.value.trim();
          if (value !== '_blank' && value !== '_self') {
            element.removeAttribute(attr.name);
          }
          continue;
        }

        if (name === 'style') {
          const declarations: string[] = [];
          for (const declaration of attr.value.split(';')) {
            const [prop, ...rest] = declaration.split(':');
            const trimmedProp = prop.trim();
            if (!trimmedProp || !INLINE_STYLES.has(trimmedProp.toLowerCase())) continue;
            const valueText = rest.join(':').trim();
            if (!valueText || /expression\s*\(|javascript:/i.test(valueText)) continue;
            declarations.push(`${trimmedProp}: ${valueText}`);
          }
          if (declarations.length) {
            element.setAttribute('style', declarations.join('; '));
          } else {
            element.removeAttribute('style');
          }
          continue;
        }

        element.removeAttribute(attr.name);
      }
    }

    Array.from(node.childNodes).forEach(walk);
  };

  walk(template.content);
  return template.innerHTML.trim();
}

function getRangeTextBefore(range: Range, root: Node): string {
  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(root);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  return beforeRange.toString();
}

function getRangeTextAfter(range: Range, root: Node): string {
  const afterRange = range.cloneRange();
  afterRange.selectNodeContents(root);
  afterRange.setStart(range.endContainer, range.endOffset);
  return afterRange.toString();
}

function getEditableContentElement(owningElement: Element): HTMLElement | null {
  return (
    owningElement.querySelector<HTMLElement>('td > div')
    ?? owningElement.querySelector<HTMLElement>('td')
    ?? (owningElement instanceof HTMLElement ? owningElement : null)
  );
}

function serializeFragment(fragment: DocumentFragment, doc: Document): string {
  const container = doc.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML.trim();
}

export function captureActiveTextSelection(editor: Editor): CapturedTextSelection | null {
  const doc = editor.Canvas.getDocument();
  if (!doc) return null;

  const selection = doc.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const rootElement = container.nodeType === Node.ELEMENT_NODE
    ? (container as Element)
    : (container.parentElement ?? null);

  if (!rootElement) return null;

  const owningElement = rootElement.closest('[data-gjs-type="mj-text"], [data-gjs-type="mj-button"]');
  if (!owningElement) return null;

  const contentElement = getEditableContentElement(owningElement);
  if (!contentElement) return null;

  if (
    !contentElement.contains(range.startContainer)
    || !contentElement.contains(range.endContainer)
  ) {
    return null;
  }

  const component = editor.Utils.helpers.getComponentModel(owningElement as HTMLElement) as Component | null;
  if (!component || (!component.is('mj-text') && !component.is('mj-button'))) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) return null;

  const selectedHtml = serializeFragment(range.cloneContents(), doc) || selectedText;

  const beforeText = getRangeTextBefore(range, contentElement);
  const afterText = getRangeTextAfter(range, contentElement);

  const context: AgentTextSelectionContext = {
    targetId: component.getId(),
    targetType: component.is('mj-text') ? 'mj-text' : 'mj-button',
    fullComponentMjml: component.toHTML?.() ?? '',
    fullComponentHtml: contentElement.innerHTML,
    selectedText,
    selectedHtml,
    beforeText,
    afterText,
    selectionPath: (owningElement as HTMLElement).dataset.gjsType ?? undefined,
  };

  return {
    component,
    range: range.cloneRange(),
    contentElement,
    beforeHtml: contentElement.innerHTML,
    context,
  };
}
