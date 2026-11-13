import type { Component, Editor } from 'grapesjs';

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

/**
 * Locks the entire canvas during template generation.
 * Prevents all user interaction with any component.
 * Returns an unlock function that restores previous states.
 */
export function lockEntireCanvas(editor: Editor): () => void {
  const lockedStates: SavedComponentState[] = [];
  let canvasOverlayElement: HTMLElement | null = null;

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

  const lockDescendants = (parentComp: Component) => {
    const children = parentComp.components?.();
    if (children) {
      children.forEach((child: Component) => {
        lockOne(child);
        lockDescendants(child);
      });
    }
  };

  // Lock the wrapper and all descendants
  const wrapper = editor.getWrapper();
  if (wrapper) {
    lockOne(wrapper);
    lockDescendants(wrapper);
  }

  // Add canvas-level visual feedback
  try {
    const canvasFrame = editor.Canvas.getFrameEl();
    const canvasBody = canvasFrame?.contentDocument?.body;
    if (canvasBody) {
      canvasBody.classList.add('builder-ai-canvas-locked');
    }

    // Create overlay to block clicks
    const canvasContainer = editor.Canvas.getElement();
    if (canvasContainer) {
      canvasOverlayElement = document.createElement('div');
      canvasOverlayElement.className = 'builder-ai-canvas-overlay';
      canvasOverlayElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.05);
        z-index: 9999;
        cursor: wait;
        pointer-events: all;
      `;
      canvasContainer.style.position = 'relative';
      canvasContainer.appendChild(canvasOverlayElement);
    }
  } catch {
    // Ignore errors accessing canvas frame
  }

  // Deselect any selected component
  editor.select();

  return () => {
    // Restore component states
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

    // Remove canvas-level class
    try {
      const canvasFrame = editor.Canvas.getFrameEl();
      const canvasBody = canvasFrame?.contentDocument?.body;
      if (canvasBody) {
        canvasBody.classList.remove('builder-ai-canvas-locked');
      }
    } catch {
      // Ignore errors
    }

    // Remove overlay
    if (canvasOverlayElement?.parentElement) {
      canvasOverlayElement.parentElement.removeChild(canvasOverlayElement);
    }
  };
}
