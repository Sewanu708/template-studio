import type { Component } from 'grapesjs';

interface SavedComponentState {
  comp: Component;
  prev: {
    draggable: unknown;
    droppable: unknown;
    editable: unknown;
    removable: unknown;
    copyable: unknown;
    builderAiLocked: unknown;
  };
}

function addLockedClass(comp: Component): void {
  const el = comp.getEl();
  if (el?.classList) {
    el.classList.add('builder-ai-locked');
  }
}

function removeLockedClass(comp: Component): void {
  const el = comp.getEl();
  if (el?.classList) {
    el.classList.remove('builder-ai-locked');
  }
}

/**
 * Locks an AI target component (and its descendants if container/section)
 * so it cannot be dragged, dropped, edited, removed, or duplicated during an active AI request.
 * Returns an unlock function that restores previous states.
 */
export function lockAgentTarget(component: Component): () => void {
  const lockedStates: SavedComponentState[] = [];

  const lockOne = (comp: Component) => {
    const prev = {
      draggable: comp.get('draggable'),
      droppable: comp.get('droppable'),
      editable: comp.get('editable'),
      removable: comp.get('removable'),
      copyable: comp.get('copyable'),
      builderAiLocked: comp.get('builderAiLocked'),
    };
    lockedStates.push({ comp, prev });

    comp.set({
      draggable: false,
      droppable: false,
      editable: false,
      removable: false,
      copyable: false,
      builderAiLocked: true,
    } as any);

    addLockedClass(comp);
  };

  // Lock target
  lockOne(component);

  // Recursively lock children if any
  const lockDescendants = (parentComp: Component) => {
    const children = parentComp.components?.();
    if (children) {
      children.forEach((child: Component) => {
        lockOne(child);
        lockDescendants(child);
      });
    }
  };
  lockDescendants(component);

  return () => {
    for (const { comp, prev } of lockedStates) {
      comp.set({
        draggable: prev.draggable,
        droppable: prev.droppable,
        editable: prev.editable,
        removable: prev.removable,
        copyable: prev.copyable,
        builderAiLocked: prev.builderAiLocked,
      } as any);

      removeLockedClass(comp);
    }
  };
}
