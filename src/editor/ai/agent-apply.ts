import type { Component, Editor } from 'grapesjs';
import type {
  AgentRequest,
  AgentResponse,
  PreparedAgentMutation,
} from './agent-types';

function findTargetComponent(
  editor: Editor,
  targetId: string,
): Component | null {
  // 1. Look up by ID via Components manager
  const byId = editor.Components.getById(targetId);
  if (byId) return byId;

  // 2. Look up via wrapper search
  const wrapper = editor.getWrapper();
  if (wrapper) {
    const found = wrapper.find(`#${targetId}`);
    if (found.length > 0) return found[0];
  }

  // 3. Only accept the selected component when the ID still matches.
  // Never fall back by type: a stale/wrong AI targetId must not replace
  // a different text/image/button that merely happens to be selected.
  const selected = editor.getSelected();
  if (selected?.getId() === targetId) return selected;

  return null;
}

/**
 * Automatically applies an AI mutation to the canvas in one undoable step.
 */
export function applyAgentMutation(params: {
  editor: Editor;
  request: AgentRequest;
  mutation: PreparedAgentMutation;
  onUndoAvailable?: (undo: () => void) => void;
}): Component | null {
  const { editor, mutation, onUndoAvailable } = params;

  // Template responses don't have targetId - use applyTemplateReplacement instead
  if (mutation.response.type === 'replace-template') {
    throw new Error(
      'Cannot use applyAgentMutation for template replacements. Use applyTemplateReplacement instead.',
    );
  }

  const targetId = mutation.response.targetId;

  const target = findTargetComponent(editor, targetId);
  if (!target) {
    throw new Error(
      `Could not apply AI change: Target component "${targetId}" was not found in the canvas.`,
    );
  }

  let replacedComponent: Component | null = null;

  try {
    if (!mutation.normalizedMjml) {
      throw new Error(
        `Could not apply AI change: prepared mutation is missing normalized MJML for target "${targetId}".`,
      );
    }

    // Perform replace operation
    const result = target.replaceWith(mutation.normalizedMjml);
    const inserted = Array.isArray(result) ? result[0] : (result as Component | undefined);

    if (inserted) {
      replacedComponent = inserted;
      editor.select(inserted);
      inserted.view?.render?.();

      const parent = inserted.parent();
      if (parent) {
        parent.view?.render?.();
      }
    }

    editor.refresh();

    if (onUndoAvailable) {
      onUndoAvailable(() => {
        editor.UndoManager.undo();
      });
    }

    (editor as unknown as { trigger: (ev: string, data?: unknown) => void }).trigger(
      'builder:ai:applied',
      {
        mutation,
        component: replacedComponent,
      },
    );
  } catch (err) {
    throw new Error(
      `Failed to apply AI mutation to canvas: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return replacedComponent;
}

/**
 * Applies a full template replacement to the canvas.
 * Captures the previous project state for undo.
 *
 * Note: grapesjs-mjml's 'mjml-import' command is a modal UI command,
 * not suitable for programmatic import. We use setComponents directly.
 */
export function applyTemplateReplacement(params: {
  editor: Editor;
  mutation: PreparedAgentMutation & {
    response: Extract<AgentResponse, { type: 'replace-template' }>;
    normalizedMjml: string;
  };
  onUndoAvailable?: (undo: () => void) => void;
}): void {
  const { editor, mutation, onUndoAvailable } = params;

  if (!mutation.normalizedMjml) {
    throw new Error(
      'Cannot apply template replacement: normalized MJML is missing.',
    );
  }

  // 1. Capture previous state for undo
  const previousProjectData = editor.getProjectData();

  try {
    // 2. Clear existing content and load new MJML
    // This mirrors grapesjs-mjml's internal onImport behavior
    const wrapper = editor.Components.getWrapper();
    if (wrapper) {
      wrapper.set('content', '');
    }

    editor.setComponents(mutation.normalizedMjml.trim());

    // 3. Refresh the editor view
    editor.refresh();

    // 4. Verify the template was loaded (check for non-empty result)
    const newWrapper = editor.Components.getWrapper();
    const hasContent = newWrapper && newWrapper.components().length > 0;
    if (!hasContent) {
      throw new Error(
        'Template import produced an empty canvas. The MJML may be invalid.',
      );
    }

    // 5. Trigger event
    (editor as unknown as { trigger: (ev: string, data?: unknown) => void }).trigger(
      'builder:ai:template-applied',
      {
        mutation,
      },
    );

    // 6. Register undo callback
    if (onUndoAvailable) {
      onUndoAvailable(() => {
        editor.loadProjectData(previousProjectData);
        editor.refresh();
      });
    }
  } catch (err) {
    // Restore previous state on failure
    try {
      editor.loadProjectData(previousProjectData);
      editor.refresh();
    } catch {
      // Ignore restore errors
    }

    throw new Error(
      `Failed to apply template to canvas: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
