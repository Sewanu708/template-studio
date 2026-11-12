import type { Component, Editor } from 'grapesjs';
import type { AgentTextSelectionResponse } from './agent-types';
import {
  sanitizeInlineHtml,
  type CapturedTextSelection,
} from './text-selection-context';

function findTargetComponent(editor: Editor, targetId: string): Component | null {
  const byId = editor.Components.getById(targetId);
  if (byId) return byId;

  const wrapper = editor.getWrapper();
  if (wrapper) {
    const found = wrapper.find(`#${targetId}`);
    if (found.length > 0) return found[0];
  }

  const selected = editor.getSelected();
  if (selected?.getId() === targetId) return selected;

  return null;
}

export function applyTextSelectionResponse(params: {
  editor: Editor;
  response: AgentTextSelectionResponse;
  capturedSelection: CapturedTextSelection;
  normalizedHtml?: string;
}): () => void {
  const { editor, response, capturedSelection, normalizedHtml } = params;
  const target = findTargetComponent(editor, response.targetId);
  if (!target) {
    throw new Error(`Could not apply selected-text AI change: target ${response.targetId} was not found.`);
  }

  if (target !== capturedSelection.component) {
    throw new Error('Selected-text AI change target no longer matches the captured text component.');
  }

  const { contentElement, range, beforeHtml } = capturedSelection;

  if (!contentElement.isConnected) {
    throw new Error('Selected text is no longer available in the canvas.');
  }

  if (
    !contentElement.contains(range.startContainer)
    || !contentElement.contains(range.endContainer)
  ) {
    throw new Error('Selected text range is no longer inside the target text component.');
  }

  const currentSelectedText = range.toString().trim().replace(/\s+/g, ' ');
  const capturedSelectedText = capturedSelection.context.selectedText.trim().replace(/\s+/g, ' ');
  if (!currentSelectedText || currentSelectedText !== capturedSelectedText) {
    throw new Error('Selected text changed before AI finished. Please select the text and try again.');
  }

  const sanitized = normalizedHtml ?? sanitizeInlineHtml(response.replacementHtml);
  if (!sanitized) {
    throw new Error('AI selected-text replacement became empty after sanitization.');
  }

  const doc = contentElement.ownerDocument;
  const template = doc.createElement('template');
  template.innerHTML = sanitized;

  range.deleteContents();
  range.insertNode(template.content.cloneNode(true));

  const nextHtml = sanitizeInlineHtml(contentElement.innerHTML);
  target.components(nextHtml);

  const undo = () => {
    target.components(beforeHtml);
  };

  return undo;
}
