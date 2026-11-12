import type { Component, Plugin } from 'grapesjs';

const ALLOWED_INLINE_TAGS = new Set([
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

const ALLOWED_INLINE_STYLES = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
]);

function getComponentType(component: Component): string {
  return String(component.get('type') ?? component.get('tagName') ?? '');
}

function isRichTextComponent(component: Component | null | undefined): component is Component {
  if (!component) return false;
  const type = getComponentType(component);
  return type === 'mj-text' || type === 'mj-button';
}

function isSafeColor(value: string): boolean {
  return (
    /^#[0-9a-f]{3,8}$/i.test(value)
    || /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(value)
    || /^[a-z]+$/i.test(value)
  );
}

function sanitizeInlineHtml(html: string, doc: Document): string {
  if (!html) return '';

  const template = doc.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (tag === 'font') {
        const span = doc.createElement('span');
        const color = element.getAttribute('color')?.trim();

        if (color && isSafeColor(color)) {
          span.setAttribute('style', `color: ${color}`);
        }

        while (element.firstChild) span.appendChild(element.firstChild);

        element.replaceWith(span);
        walk(span);
        return;
      }

      if (!ALLOWED_INLINE_TAGS.has(tag)) {
        element.replaceWith(doc.createTextNode(element.textContent ?? ''));
        return;
      }

      for (const attr of [...element.attributes]) {
        const name = attr.name.toLowerCase();

        if (name === 'href') {
          const value = attr.value.trim();
          if (!/^https?:\/\//i.test(value) && !value.startsWith('#') && !value.startsWith('mailto:')) {
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
          const kept: string[] = [];

          for (const declaration of attr.value.split(';')) {
            const [prop, ...rest] = declaration.split(':');
            const trimmedProp = prop.trim();
            if (!trimmedProp || !ALLOWED_INLINE_STYLES.has(trimmedProp.toLowerCase())) continue;

            const valueText = rest.join(':').trim();
            if (!valueText || /expression\s*\(|javascript:/i.test(valueText)) continue;
            kept.push(`${trimmedProp}: ${valueText}`);
          }

          if (kept.length) {
            element.setAttribute('style', kept.join('; '));
          } else {
            element.removeAttribute('style');
          }
          continue;
        }

        if (name.startsWith('on')) {
          element.removeAttribute(attr.name);
          continue;
        }

        if (!['href', 'target', 'style'].includes(name)) {
          element.removeAttribute(attr.name);
        }
      }
    }

    [...node.childNodes].forEach(walk);
  };

  const cleanup = (node: Node): void => {
    [...node.childNodes].forEach(cleanup);

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === 'br') return;

    const hasMeaningfulText = Boolean(element.textContent?.trim());
    const hasLineBreak = Boolean(element.querySelector('br'));

    if (!hasMeaningfulText && !hasLineBreak) {
      element.remove();
      return;
    }

    if (tag === 'span' && element.attributes.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }

    if (tag === 'a' && !element.getAttribute('href')) {
      element.replaceWith(...element.childNodes);
    }
  };

  walk(template.content);
  cleanup(template.content);

  return template.innerHTML.trim();
}

function getViewModel(view: unknown): Component | null {
  const model = (view as { model?: Component }).model;
  return model ?? null;
}

function getViewContentElement(view: unknown): HTMLElement | null {
  const typedView = view as {
    getChildrenContainer?: () => HTMLElement;
    el?: HTMLElement;
  };

  return typedView.getChildrenContainer?.() ?? typedView.el ?? null;
}

function sanitizeComponentContent(component: Component, rawHtml: string, doc: Document): void {
  const sanitized = sanitizeInlineHtml(rawHtml, doc);
  if (sanitized === rawHtml.trim()) return;

  component.components(sanitized);
}

function createColorIcon(): HTMLElement {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = '#16a34a';
  input.setAttribute('aria-label', 'Text color');
  input.style.width = '18px';
  input.style.height = '18px';
  input.style.padding = '0';
  input.style.border = '0';
  input.style.background = 'transparent';
  input.style.cursor = 'pointer';
  return input;
}

function createTextIcon(label: string): HTMLElement {
  const span = document.createElement('span');
  span.textContent = label;
  return span;
}

export const mjTextInlineEditingPlugin: Plugin = (editor) => {
  const registerBuilderRteActions = () => {
    if (editor.RichTextEditor.get('builder-text-color')) return;

    editor.RichTextEditor.add('builder-text-color', {
      icon: createColorIcon(),
      event: 'input',
      attributes: { title: 'Text color' },
      result: (rte, action) => {
        const input = action.btn?.querySelector<HTMLInputElement>('input[type="color"]');
        if (!input) return;

        rte.exec('foreColor', input.value);
      },
    });

    editor.RichTextEditor.add('builder-clear-format', {
      icon: createTextIcon('Tx'),
      attributes: { title: 'Clear formatting' },
      result: (rte) => {
        rte.exec('removeFormat');
      },
    });
  };

  editor.onReady(registerBuilderRteActions);

  editor.on('rte:disable', (view: unknown) => {
    const component = getViewModel(view);
    if (!isRichTextComponent(component)) return;

    const contentElement = getViewContentElement(view);
    const doc = contentElement?.ownerDocument ?? editor.Canvas.getDocument() ?? document;
    const rawHtml = contentElement?.innerHTML ?? String(component.get('content') ?? '');

    queueMicrotask(() => sanitizeComponentContent(component, rawHtml, doc));
  });
};
