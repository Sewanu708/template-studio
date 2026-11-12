import type { Block, Component, Plugin } from 'grapesjs';
import {
  getLayoutSpec,
  type ColumnLayoutSpec,
} from '../blocks/layout';

export const canvasCommunicationCss = `
  :root {
    --builder-green: #22c55e;
    --builder-green-soft: rgba(34, 197, 94, 0.12);
    --builder-red: #ef4444;
    --builder-workspace: #eef1f5;
  }

  html,
  body {
    min-height: 100%;
    background: var(--builder-workspace) !important;
  }

  body {
    overflow-x: hidden;
    padding: 48px 24px 80px !important;
  }

  [data-gjs-type="wrapper"],
  [data-gjs-type="mjml"] {
    min-height: 0 !important;
  }

  [data-gjs-type="mjml"] {
    position: relative;
    width: min(600px, 100%);
    margin: 0 auto;
  }

  [data-gjs-type="mj-body"] {
    position: relative;
    width: 100% !important;
    min-height: calc(100vh - 128px) !important;
    background: #ffffff !important;
    border: 1px solid #dbe1e8;
    border-radius: 2px;
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
    transition: box-shadow 140ms ease, outline-color 140ms ease;
  }



  [data-gjs-type="mj-section"],
  [data-gjs-type="mj-group"],
  [data-gjs-type="mj-column"] {
    position: relative;
    box-sizing: border-box;
    transition: outline-color 120ms ease, background-color 120ms ease, opacity 120ms ease, min-height 120ms ease;
  }

  [data-gjs-type="mj-section"]:hover {
    outline: 1px solid rgba(34, 197, 94, 0.65);
    outline-offset: -1px;
  }

  [data-gjs-type="mj-column"]:hover {
    outline: 1px dashed rgba(14, 165, 233, 0.8);
    outline-offset: -2px;
  }

  [data-gjs-type="mj-group"]:hover {
    outline: 1px dashed rgba(139, 92, 246, 0.8);
    outline-offset: -2px;
  }

  [data-gjs-type="mj-group"]:not(:has([data-gjs-type="mj-column"])) {
    min-height: 76px;
    outline: 1px dashed #86efac;
    outline-offset: -3px;
    background: rgba(240, 253, 244, 0.72);
  }

  [data-gjs-type="mj-group"]:not(:has([data-gjs-type="mj-column"]))::after {
    content: "Drop columns here";
    position: absolute;
    inset: 8px;
    display: grid;
    place-items: center;
    color: #16a34a;
    font: 600 11px/1.2 Inter, system-ui, sans-serif;
    pointer-events: none;
  }

  .gjs-selected[data-gjs-type="mj-section"] {
    outline: 2px solid var(--builder-green) !important;
    outline-offset: -2px;
  }

  .builder-section-active {
    outline: 2px solid var(--builder-green) !important;
    outline-offset: -2px;
  }

  .builder-section-control {
    position: absolute;
    z-index: 40;
    left: 50%;
    display: inline-flex;
    gap: 4px;
    padding: 3px;
    border: 1px solid rgba(34, 197, 94, 0.35);
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
    transform: translateX(-50%);
  }

  body.builder-section-drop-buffer-active .builder-section-drop-buffer {
    display: block;
  }

  .builder-section-drop-buffer:hover,
  .builder-section-drop-buffer.drag-over {
    opacity: 1;
  }

  .builder-section-drop-buffer {
    position: relative;
    display: none;
    width: 100%;
    height: 12px;
    margin: -6px 0;
    z-index: 50;
    pointer-events: auto;
    border-radius: 999px;
    background: transparent;
    box-shadow: none;
    opacity: 0;
    transition: opacity 120ms ease, background 120ms ease;
  }

  .builder-section-drop-buffer:hover,
  .builder-section-drop-buffer.drag-over {
    background: rgba(34, 197, 94, 0.14);
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.55);
  }

  .builder-section-drop-buffer::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 72px;
    height: 3px;
    border-radius: 999px;
    background: rgba(34, 197, 94, 0.9);
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .builder-section-drop-buffer:hover::before,
  .builder-section-drop-buffer.drag-over::before {
    opacity: 1;
  }

  .builder-body-add-section {
    display: flex;
    justify-content: center;
    padding: 16px 0 8px;
  }

  .builder-body-add-section-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border: 1px solid rgba(34, 197, 94, 0.35);
    border-radius: 999px;
    background: #ffffff;
    color: #166534;
    font: 700 13px/1 Inter, system-ui, sans-serif;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
    cursor: pointer;
    transition: background-color 140ms ease, transform 140ms ease;
  }

  .builder-body-add-section-button:hover {
    background: #dcfce7;
    transform: translateY(-1px);
  }

  .builder-body-add-section-button:active {
    background: #bbf7d0;
    transform: translateY(0);
  }

  .builder-section-control-top {
    top: -17px;
  }

  .builder-section-control-bottom {
    bottom: -17px;
  }

  .builder-section-action {
    width: 24px;
    height: 22px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #166534;
    font: 700 14px/1 Inter, system-ui, sans-serif;
    cursor: pointer;
  }

  .builder-section-action:hover {
    background: #dcfce7;
  }

  .builder-section-action:active {
    background: #bbf7d0;
  }

  .gjs-selected[data-gjs-type="mj-column"] {
    outline: 2px solid #0ea5e9 !important;
    outline-offset: -2px;
  }

  .gjs-selected[data-gjs-type="mj-group"] {
    outline: 2px solid #8b5cf6 !important;
    outline-offset: -2px;
  }

  [data-gjs-type="mj-column"]:not(:has([data-gjs-type])) {
    min-height: 72px;
    outline: 1px dashed #86efac;
    outline-offset: -3px;
    background: rgba(240, 253, 244, 0.72);
  }

  [data-gjs-type="mj-column"]:not(:has([data-gjs-type]))::after {
    content: "Drop content here";
    position: absolute;
    inset: 8px;
    display: grid;
    place-items: center;
    color: #16a34a;
    font: 600 11px/1.2 Inter, system-ui, sans-serif;
    letter-spacing: 0.01em;
    pointer-events: none;
  }

  [data-gjs-type="mj-section"]:not(:has([data-gjs-type="mj-column"])) {
    min-height: 88px;
    outline: 1px dashed #fbbf24;
    outline-offset: -3px;
    background: rgba(255, 251, 235, 0.7);
  }

  [data-gjs-type="mj-section"]:not(:has([data-gjs-type="mj-column"]))::after {
    content: "Drop a column here";
    position: absolute;
    inset: 8px;
    display: grid;
    place-items: center;
    color: #b45309;
    font: 600 11px/1.2 Inter, system-ui, sans-serif;
    pointer-events: none;
  }

  [data-gjs-type="mj-body"]:not(:has([data-gjs-type="mj-section"]))::after {
    content: "Drop a section here";
    position: absolute;
    inset: 20px;
    display: grid;
    min-height: 120px;
    place-items: center;
    border: 1px dashed #94a3b8;
    border-radius: 4px;
    color: #64748b;
    font: 600 12px/1.2 Inter, system-ui, sans-serif;
    pointer-events: none;
  }

  body.builder-dragging-layout [data-gjs-type="mj-body"] {
    outline: 2px dashed var(--builder-green);
    outline-offset: 4px;
    box-shadow: 0 0 0 8px var(--builder-green-soft), 0 8px 28px rgba(15, 23, 42, 0.12);
  }

  .builder-drop-valid {
    outline: 3px solid var(--builder-green) !important;
    outline-offset: -3px !important;
    background-color: var(--builder-green-soft) !important;
  }

  .builder-drop-valid::after {
    content: none !important;
    display: none !important;
  }

  .builder-drop-invalid {
    outline: 2px solid var(--builder-red) !important;
    outline-offset: -2px !important;
    opacity: 0.58;
  }

  .builder-drop-invalid::before {
    content: attr(data-builder-drop-message);
    position: absolute;
    z-index: 20;
    top: 6px;
    right: 6px;
    max-width: calc(100% - 12px);
    padding: 4px 7px;
    border-radius: 4px;
    background: var(--builder-red);
    color: #ffffff;
    font: 600 10px/1.25 Inter, system-ui, sans-serif;
    pointer-events: none;
  }

  .builder-column-insert-before::before,
  .builder-column-insert-after::before {
    content: "";
    position: absolute;
    z-index: 24;
    top: -3px;
    bottom: -3px;
    width: 4px;
    border-radius: 3px;
    background: var(--builder-green);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    pointer-events: none;
  }

  .builder-column-insert-before::before {
    left: -2px;
  }

  .builder-column-insert-after::before {
    right: -2px;
  }

  @media (max-width: 520px) {
    body {
      padding: 44px 12px 60px !important;
    }

    [data-gjs-type="mj-body"] {
      min-height: calc(100vh - 104px) !important;
    }
  }
`;

type DragKind = 'layout' | 'content' | 'layout-preset' | 'existing-content';

const MOVABLE_CONTENT_TYPES = new Set([
  'mj-text',
  'mj-image',
  'mj-button',
  'mj-divider',
  'mj-spacer',
]);

const ROW_CONTAINER_TYPES = ['mj-section', 'mj-group'] as const;

function isRowItemForContainer(container: Component, component: Component): boolean {
  if (container.is('mj-group')) return component.is('mj-column');
  return component.is('mj-column') || component.is('mj-group');
}

function getRowItemElements(container: Component): HTMLElement[] {
  return container.components()
    .filter((component: Component) => isRowItemForContainer(container, component))
    .map((component: Component) => component.getEl())
    .filter((element): element is HTMLElement => Boolean(element));
}

function resetEqualHeightItems(items: HTMLElement[]): void {
  items.forEach((element) => {
    element.style.minHeight = '';
    element.removeAttribute('data-builder-equal-height');
  });
}

function stretchRowItems(rowItems: HTMLElement[]): void {
  if (rowItems.length < 2) return;

  const maxHeight = Math.max(
    ...rowItems.map((element) => element.getBoundingClientRect().height),
  );

  if (!Number.isFinite(maxHeight) || maxHeight <= 0) return;

  const height = `${Math.ceil(maxHeight)}px`;
  rowItems.forEach((element) => {
    element.style.minHeight = height;
    element.dataset.builderEqualHeight = 'true';
  });
}

function getDragKind(block: Block): DragKind {
  const id = block.getId();
  if (getLayoutSpec(block)) return 'layout-preset';
  return id.startsWith('layout-') || id.startsWith('composition-') ? 'layout' : 'content';
}

export const canvasCommunicationPlugin: Plugin = (editor) => {
  let dragKind: DragKind | null = null;
  let layoutSpec: ColumnLayoutSpec | null = null;
  let highlighted: HTMLElement | null = null;
  let insertionTarget: HTMLElement | null = null;
  let equalHeightFrame = 0;
  let imageLoadDocument: Document | null = null;

  const clearHighlight = () => {
    highlighted?.classList.remove('builder-drop-valid', 'builder-drop-invalid');
    highlighted?.removeAttribute('data-builder-drop-message');
    highlighted = null;
    insertionTarget?.classList.remove(
      'builder-column-insert-before',
      'builder-column-insert-after',
    );
    insertionTarget = null;
  };

  const markValid = (element: HTMLElement) => {
    highlighted = element;
    highlighted.classList.add('builder-drop-valid');
  };

  const markInvalid = (element: HTMLElement, message: string) => {
    highlighted = element;
    highlighted.dataset.builderDropMessage = message;
    highlighted.classList.add('builder-drop-invalid');
  };

  const markColumnInsertion = (column: HTMLElement, event: Event) => {
    const rect = column.getBoundingClientRect();
    const insertBefore = (event as MouseEvent).clientX < rect.left + rect.width / 2;
    insertionTarget = column;
    insertionTarget.classList.add(
      insertBefore ? 'builder-column-insert-before' : 'builder-column-insert-after',
    );
  };

  const clearDragState = () => {
    clearHighlight();
    dragKind = null;
    layoutSpec = null;
    const body = editor.Canvas.getBody();
    body?.classList.remove(
      'builder-dragging-layout',
      'builder-dragging-content',
      'builder-dragging-layout-preset',
    );
  };

  const startDrag = (block: Block) => {
    clearDragState();
    dragKind = getDragKind(block);
    layoutSpec = getLayoutSpec(block);
    editor.Canvas.getBody()?.classList.add(`builder-dragging-${dragKind}`);
  };

  const startComponentDrag = ({ target }: { target?: Component }) => {
    if (!target || !MOVABLE_CONTENT_TYPES.has(String(target.get('type') ?? ''))) return;

    clearDragState();
    dragKind = 'existing-content';
    editor.Canvas.getBody()?.classList.add('builder-dragging-content');
  };

  const updateDropFeedback = (event: Event) => {
    if (!dragKind) return;
    const target = event.target as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') return;

    clearHighlight();
    const columnElement = target.closest<HTMLElement>('[data-gjs-type="mj-column"]');
    const groupElement = target.closest<HTMLElement>('[data-gjs-type="mj-group"]');
    const sectionElement = target.closest<HTMLElement>('[data-gjs-type="mj-section"]');
    const bodyElement = target.closest<HTMLElement>('[data-gjs-type="mj-body"]');

    if (dragKind === 'layout') {
      const obstructingTarget = columnElement ?? groupElement ?? sectionElement;
      if (obstructingTarget) {
        markInvalid(obstructingTarget, 'This block creates a full section');
      } else if (bodyElement) {
        markValid(bodyElement);
      }
      return;
    }

    if (dragKind === 'content' || dragKind === 'existing-content') {
      if (columnElement) {
        markValid(columnElement);
        return;
      }

      if (dragKind === 'existing-content') {
        const invalidTarget = sectionElement ?? bodyElement;
        if (invalidTarget) markInvalid(invalidTarget, 'Move content into a column');
        return;
      }

      if (sectionElement) {
        const section = editor.Utils.helpers.getComponentModel(sectionElement);
        if (section?.components().length === 0) {
          markValid(sectionElement);
        } else {
          markInvalid(sectionElement, 'Choose a column for this content');
        }
        return;
      }

      if (bodyElement) markValid(bodyElement);
      return;
    }

    if (columnElement) {
      const column = editor.Utils.helpers.getComponentModel(columnElement);
      const parent = column?.parent();

      if (parent?.is('mj-group')) {
        if (groupElement) markValid(groupElement);
        return;
      }

      if (layoutSpec?.kind === 'column' && parent?.is('mj-section')) {
        markValid(sectionElement ?? columnElement);
        markColumnInsertion(columnElement, event);
        return;
      }

      if (layoutSpec?.supportsInnerLayout && parent?.is('mj-section')) {
        markValid(columnElement);
      } else {
        markInvalid(columnElement, 'This layout cannot be placed here');
      }
      return;
    }

    if (groupElement) {
      markValid(groupElement);
      return;
    }

    if (sectionElement) {
      if (layoutSpec?.kind === 'column') {
        markValid(sectionElement);
      } else {
        markInvalid(sectionElement, 'Drop this preset on a column or the email body');
      }
      return;
    }

    if (bodyElement) {
      markValid(bodyElement);
      return;
    }

    const component = target.closest<HTMLElement>('[data-gjs-type]');
    if (component) markInvalid(component, 'Invalid drop destination');
  };

  const syncEqualHeightRows = () => {
    const wrapper = editor.getWrapper();
    if (!wrapper) return;

    const rowItemsByContainer = ROW_CONTAINER_TYPES.flatMap((type) => (
      wrapper.findType(type).map(getRowItemElements)
    ));
    const allRowItems = Array.from(new Set(rowItemsByContainer.flat()));

    resetEqualHeightItems(allRowItems);

    // Inner layouts first, then sections. This lets a group settle to the
    // right height before the parent section measures it beside sibling columns.
    wrapper.findType('mj-group').map(getRowItemElements).forEach(stretchRowItems);
    wrapper.findType('mj-section').map(getRowItemElements).forEach(stretchRowItems);
  };

  const scheduleEqualHeightSync = () => {
    if (equalHeightFrame) return;

    const canvasWindow = editor.Canvas.getWindow();
    const requestFrame = canvasWindow?.requestAnimationFrame
      ?? window.requestAnimationFrame;

    equalHeightFrame = requestFrame(() => {
      equalHeightFrame = 0;
      syncEqualHeightRows();
    });
  };

  const handleCanvasImageLoad = (event: Event) => {
    const target = event.target;
    if (!target || (target as Element).tagName !== 'IMG') return;
    scheduleEqualHeightSync();
  };

  const bindCanvasImageLoadSync = () => {
    const canvasDocument = editor.Canvas.getDocument();
    if (!canvasDocument || imageLoadDocument === canvasDocument) return;

    imageLoadDocument?.removeEventListener('load', handleCanvasImageLoad, true);
    canvasDocument.addEventListener('load', handleCanvasImageLoad, true);
    imageLoadDocument = canvasDocument;
  };

  editor.onReady(() => {
    bindCanvasImageLoadSync();
    scheduleEqualHeightSync();
  });

  editor.on('block:drag:start', startDrag);
  editor.on('component:drag:start', startComponentDrag);
  editor.on('canvas:dragover', updateDropFeedback);
  editor.on('block:drag:stop component:drag:end canvas:dragend', clearDragState);
  editor.on('component:add component:update component:remove canvas:refresh canvas:frame:load', () => {
    bindCanvasImageLoadSync();
    scheduleEqualHeightSync();
  });
};
