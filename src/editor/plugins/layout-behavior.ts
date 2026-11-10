import type {
  Block,
  Component,
  ComponentDefinition,
  ContentType,
  DraggableDroppableFn,
  Plugin,
} from 'grapesjs';
import {
  getLayoutSpec,
  type ColumnLayoutSpec,
} from '../blocks/layout';

const PRIMITIVE_BLOCK_PREFIX = 'primitive-';

const BODY_CHILD_TYPES = new Set([
  'mj-section',
  'mj-wrapper',
  'mj-hero',
  'mj-raw',
]);

interface SorterDragEvent {
  targetModel?: Component | null;
}

function getComponentType(content: ContentType): string | null {
  if (typeof content !== 'string') return null;
  return content.trim().match(/^<([a-z][\w-]*)\b/i)?.[1]?.toLowerCase() ?? null;
}

function wrapForBody(content: ContentType): ContentType {
  if (typeof content !== 'string') return content;
  return `<mj-section padding="0px">
  <mj-column padding="0px">
    ${content}
  </mj-column>
</mj-section>`;
}

function wrapForSection(content: ContentType): ContentType {
  if (typeof content !== 'string') return content;
  return `<mj-column padding="0px">
  ${content}
</mj-column>`;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function formatPercentage(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function normalizeRatios(ratios: number[]): number[] {
  const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
  if (total <= 0) return [];
  return ratios.map((ratio) => (ratio / total) * 100);
}

function createInnerLayout(column: Component, ratios: number[]): ComponentDefinition {
  const width = column.getAttributes().width;
  const normalizedRatios = normalizeRatios(ratios);

  return {
    type: 'mj-group',
    tagName: 'mj-group',
    name: 'Inner Layout',
    attributes: typeof width === 'string' && width
      ? { width: escapeAttribute(width) }
      : {},
    components: normalizedRatios.map((ratio) => ({
      type: 'mj-column',
      tagName: 'mj-column',
      attributes: { width: `${formatPercentage(ratio)}%`, padding: '0px' },
    })),
  };
}

function createColumnMarker(): string {
  return '<mj-column padding="0px"></mj-column>';
}

function setColumnWidth(column: Component, ratio: number): void {
  column.addAttributes({ width: `${formatPercentage(ratio)}%` });
}

function getLayoutChildren(container: Component): Component[] {
  return container.components().filter((component: Component) => (
    component.is('mj-column')
    || (container.is('mj-section') && component.is('mj-group'))
  ));
}

function distributeEqually(container: Component): void {
  const children = getLayoutChildren(container);
  if (!children.length) return;

  const width = 100 / children.length;
  children.forEach((component) => setColumnWidth(component, width));
}

function fillAvailableWidth(container: Component): void {
  const children = getLayoutChildren(container);
  if (!children.length) return;

  const currentWidths = children.map((component) => {
    const width = Number.parseFloat(String(component.getAttributes().width ?? ''));
    return Number.isFinite(width) && width > 0 ? width : null;
  });

  if (currentWidths.some((width) => width === null)) {
    distributeEqually(container);
    return;
  }

  const normalized = normalizeRatios(currentWidths as number[]);
  children.forEach((component, index) => setColumnWidth(component, normalized[index]));
}

function addPresetColumns(
  innerLayout: Component,
  droppedColumn: Component,
  count: number,
): void {
  const insertAt = droppedColumn.index() + 1;

  for (let index = 1; index < count; index += 1) {
    innerLayout.append(createColumnMarker(), { at: insertAt + index - 1 });
  }

  innerLayout.set('name', 'Inner Layout');
  distributeEqually(innerLayout);
}

/**
 * Owns structural transformations made while dropping blocks.
 *
 * Rule 1: primitive content dropped directly on mj-body is inserted as
 * mj-body > mj-section > mj-column > primitive. The dynamic block content
 * means the invalid intermediate tree never enters the project model.
 *
 * Rule 2: an inner-capable layout preset dropped on a top-level mj-column
 * replaces that column with an mj-group (shown as "Inner Layout") using the
 * preset's ratios. Existing content moves into the first inner column.
 */
export const layoutBehaviorPlugin: Plugin = (editor) => {
  let activeBlockDrag = false;
  let activePrimitiveBlock = false;
  let activeLayoutSpec: ColumnLayoutSpec | null = null;
  let dropDirectlyOnBody = false;
  let hoveredEmptySection: Component | null = null;
  let hoveredColumn: Component | null = null;
  let hoveredInnerLayout: Component | null = null;
  let hoveredSection: Component | null = null;
  let sectionInsertIndex: number | null = null;
  let hoveringAnyColumn = false;
  let hoveringAnyGroup = false;
  let hoveringAnySection = false;
  const primitiveTypes = new Set<string>();

  const canDragPrimitive: DraggableDroppableFn = (_source, target) => (
    target.is('mj-column')
    || target.is('mj-body')
    || hoveredEmptySection === target
  );

  const canDragLayoutPreset: DraggableDroppableFn = (_source, target) => {
    if (target.is('mj-body')) {
      return !hoveringAnyColumn && !hoveringAnyGroup && !hoveringAnySection;
    }
    if (target.is('mj-group')) return hoveredInnerLayout === target;
    if (target.is('mj-section')) {
      if (activeLayoutSpec?.kind === 'column') return hoveredSection === target;
      return (
        Boolean(activeLayoutSpec?.supportsInnerLayout)
        && hoveredColumn?.parent() === target
      );
    }
    return false;
  };

  const getSourceType = (source: Component): string => (
    source.get('type')
    || source.getEl()?.dataset.gjsType
    || String(source.get('tagName') ?? '')
  );

  const configureSectionDroppable = (section: Component) => {
    editor.UndoManager.skip(() => {
      section.set('droppable', (source: Component) => {
        if (activeBlockDrag) {
          if (activePrimitiveBlock) return hoveredEmptySection === section;
          if (activeLayoutSpec?.kind === 'column') return hoveredSection === section;
          return Boolean(
            activeLayoutSpec?.supportsInnerLayout
            && hoveredColumn?.parent() === section,
          );
        }

        const sourceType = getSourceType(source);
        return sourceType === 'mj-column'
          || sourceType === 'mj-group';
      });
    });
  };

  const configureColumnDroppable = (column: Component) => {
    editor.UndoManager.skip(() => {
      column.set('droppable', (source: Component) => (
        primitiveTypes.has(getSourceType(source))
      ));
    });
  };

  const configureExistingContent = (component: Component) => {
    if (!primitiveTypes.has(getSourceType(component))) return;

    editor.UndoManager.skip(() => {
      component.set('draggable', (_source: Component, target: Component) => (
        target.is('mj-column')
      ));
    });
  };

  editor.Blocks.getAll().forEach((block: Block) => {
    if (!block.getId().startsWith(PRIMITIVE_BLOCK_PREFIX)) return;

    const content = block.getContent();
    if (typeof content === 'function' || content === undefined) return;

    const componentType = getComponentType(content);
    if (!componentType) return;

    primitiveTypes.add(componentType);
    block.set({
      content: () => hoveredEmptySection
        ? wrapForSection(content)
        : dropDirectlyOnBody
          ? wrapForBody(content)
          : content,
      dragDef: {
        type: componentType,
        draggable: canDragPrimitive,
      },
    });
  });

  editor.Blocks.getAll().forEach((block: Block) => {
    const spec = getLayoutSpec(block);
    if (!spec) return;

    const content = block.getContent();
    if (!content || typeof content === 'function') return;

    block.set({
      content: () => hoveredColumn
        ? createInnerLayout(hoveredColumn, spec.ratios)
        : hoveredInnerLayout
          ? createColumnMarker()
          : hoveredSection && spec.kind === 'column'
            ? createColumnMarker()
          : content,
      dragDef: {
        type: 'mj-column',
        draggable: canDragLayoutPreset,
      },
    });
  });

  editor.onReady(() => {
    const body = editor.getWrapper()?.findType('mj-body')[0];
    if (!body) return;

    editor.getWrapper()?.findType('mj-section').forEach(configureSectionDroppable);
    editor.getWrapper()?.findType('mj-column').forEach(configureColumnDroppable);
    primitiveTypes.forEach((type) => {
      editor.getWrapper()?.findType(type).forEach(configureExistingContent);
    });

    editor.UndoManager.skip(() => {
      body.set('droppable', (source: Component) => {
        const sourceType = getSourceType(source);
        const hoveringStructure = (
          hoveringAnyColumn
          || hoveringAnyGroup
          || hoveringAnySection
        );

        if (activePrimitiveBlock) return !hoveringStructure;
        if (activeLayoutSpec) return !hoveringStructure;
        if (!sourceType) return false;

        if (BODY_CHILD_TYPES.has(sourceType)) {
          return !activeBlockDrag || !hoveringStructure;
        }

        return false;
      });
    });
  });

  editor.on('block:drag:start', (block) => {
    activeBlockDrag = true;
    activePrimitiveBlock = block.getId().startsWith(PRIMITIVE_BLOCK_PREFIX);
    const layoutSpec = getLayoutSpec(block);
    activeLayoutSpec = layoutSpec;
    dropDirectlyOnBody = false;
    hoveredEmptySection = null;
    hoveredColumn = null;
    hoveredInnerLayout = null;
    hoveredSection = null;
    sectionInsertIndex = null;
    hoveringAnyColumn = false;
    hoveringAnyGroup = false;
    hoveringAnySection = false;
  });

  editor.on('canvas:dragover', (event: Event) => {
    if (!activeBlockDrag) return;

    const target = event.target as HTMLElement | null;
    const columnElement = target?.closest<HTMLElement>('[data-gjs-type="mj-column"]');
    const groupElement = target?.closest<HTMLElement>('[data-gjs-type="mj-group"]');
    const sectionElement = target?.closest<HTMLElement>('[data-gjs-type="mj-section"]');
    const column = columnElement
      ? editor.Utils.helpers.getComponentModel(columnElement) ?? null
      : null;
    const group = groupElement
      ? editor.Utils.helpers.getComponentModel(groupElement) ?? null
      : null;
    const section = sectionElement
      ? editor.Utils.helpers.getComponentModel(sectionElement) ?? null
      : null;
    const columnParent = column?.parent() ?? null;

    hoveringAnyColumn = Boolean(column);
    hoveringAnyGroup = Boolean(group);
    hoveringAnySection = Boolean(section);
    hoveredEmptySection = (
      activePrimitiveBlock
      && section?.is('mj-section')
      && section.components().length === 0
    ) ? section : null;

    if (!activeLayoutSpec) return;

    hoveredColumn = (
      activeLayoutSpec.supportsInnerLayout
      && columnParent?.is('mj-section')
    ) ? column : null;
    hoveredInnerLayout = columnParent?.is('mj-group')
      ? columnParent
      : group?.is('mj-group')
        ? group
        : null;
    hoveredSection = activeLayoutSpec.kind === 'column'
      ? columnParent?.is('mj-section')
        ? columnParent
        : section?.is('mj-section')
          ? section
          : null
      : null;
    sectionInsertIndex = null;

    if (hoveredSection) {
      if (column && columnParent === hoveredSection) {
        const rect = columnElement?.getBoundingClientRect();
        const clientX = (event as MouseEvent).clientX;
        const insertBefore = rect ? clientX < rect.left + rect.width / 2 : false;
        sectionInsertIndex = column.index() + (insertBefore ? 0 : 1);
      } else {
        sectionInsertIndex = hoveredSection.components().length;
      }
    }
  });

  editor.on('sorter:drag', ({ targetModel }: SorterDragEvent) => {
    if (!activePrimitiveBlock) return;
    dropDirectlyOnBody = targetModel?.is('mj-body') === true;
  });

  editor.on('canvas:drop', (_dataTransfer, dropped: Component | Component[]) => {
    if (!activeLayoutSpec) return;

    const droppedComponent = Array.isArray(dropped) ? dropped[0] : dropped;

    if (hoveredInnerLayout) {
      if (!droppedComponent?.is('mj-column')) return;
      if (droppedComponent.parent() !== hoveredInnerLayout) return;

      addPresetColumns(
        hoveredInnerLayout,
        droppedComponent,
        activeLayoutSpec.ratios.length,
      );
      editor.select(hoveredInnerLayout);
      return;
    }

    if (hoveredSection) {
      if (!droppedComponent?.is('mj-column')) return;
      if (droppedComponent.parent() !== hoveredSection) return;

      if (sectionInsertIndex !== null && droppedComponent.index() !== sectionInsertIndex) {
        const moveAt = droppedComponent.index() < sectionInsertIndex
          ? sectionInsertIndex + 1
          : sectionInsertIndex;
        droppedComponent.move(hoveredSection, { at: moveAt });
      }

      distributeEqually(hoveredSection);
      editor.select(droppedComponent);
      return;
    }

    if (!hoveredColumn) return;

    const innerLayout = droppedComponent;
    const originalColumn = hoveredColumn;
    const section = originalColumn.parent();

    if (!innerLayout?.is('mj-group') || !section?.is('mj-section')) return;
    if (innerLayout.parent() !== section) return;

    const originalIndex = originalColumn.index();
    const firstInnerColumn = innerLayout.components().at(0);
    if (!firstInnerColumn?.is('mj-column')) return;

    innerLayout.set('name', 'Inner Layout');

    [...originalColumn.components().models].forEach((component, index) => {
      component.move(firstInnerColumn, { at: index });
    });

    originalColumn.remove({ action: 'component:move' });
    innerLayout.move(section, { at: originalIndex });
    editor.select(innerLayout);
  });

  editor.on('component:remove:before', (component: Component) => {
    if (!component.is('mj-column') && !component.is('mj-group')) return;

    const container = component.parent();
    if (!container?.is('mj-section') && !container?.is('mj-group')) return;

    queueMicrotask(() => fillAvailableWidth(container));
  });

  editor.on('component:add', (component: Component) => {
    if (component.is('mj-section')) configureSectionDroppable(component);
    if (component.is('mj-column')) configureColumnDroppable(component);
    configureExistingContent(component);
  });

  editor.on('block:drag:stop canvas:dragend', () => {
    activeBlockDrag = false;
    activePrimitiveBlock = false;
    activeLayoutSpec = null;
    dropDirectlyOnBody = false;
    hoveredEmptySection = null;
    hoveredColumn = null;
    hoveredInnerLayout = null;
    hoveredSection = null;
    sectionInsertIndex = null;
    hoveringAnyColumn = false;
    hoveringAnyGroup = false;
    hoveringAnySection = false;
  });
};
