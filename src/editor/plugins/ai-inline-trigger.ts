import type { Component, Plugin } from 'grapesjs';
import { resolveAgentTarget } from '../ai/agent-context';
import { captureActiveTextSelection } from '../ai/text-selection-context';

const SPARKLE_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; display:inline-block;">
  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  <path d="M5 3v4"/>
  <path d="M9 3v4"/>
  <path d="M3 5h4"/>
  <path d="M3 9h4"/>
</svg>
`.trim();

const TOOLBAR_CSS = `
  .gjs-toolbar-item--ai {
    background-color: #6366f1 !important;
    color: #ffffff !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: background-color 0.15s ease !important;
  }
  .gjs-toolbar-item--ai:hover {
    background-color: #4f46e5 !important;
  }
`;

export const aiInlineTriggerPlugin: Plugin = (editor) => {
  // 1. Inject toolbar styling into document and canvas
  const injectStyles = () => {
    if (!document.getElementById('gjs-ai-toolbar-styles')) {
      const style = document.createElement('style');
      style.id = 'gjs-ai-toolbar-styles';
      style.textContent = TOOLBAR_CSS;
      document.head.appendChild(style);
    }

    const frame = editor.Canvas.getFrameEl();
    const doc = frame?.contentDocument ?? editor.Canvas.getDocument();
    if (doc && !doc.getElementById('gjs-ai-toolbar-styles')) {
      const style = doc.createElement('style');
      style.id = 'gjs-ai-toolbar-styles';
      style.textContent = TOOLBAR_CSS;
      doc.head.appendChild(style);
    }
  };

  editor.on('load', injectStyles);
  editor.on('canvas:load', injectStyles);

  // 2. Register command to trigger builder:ai:open
  if (!editor.Commands.has('tlb-ai-edit')) {
    editor.Commands.add('tlb-ai-edit', {
      run(ed) {
        const selected = ed.getSelected();
        const resolved = resolveAgentTarget(selected ?? null);

        const capturedSelection = captureActiveTextSelection(ed);
        if (capturedSelection) {
          ed.trigger('builder:ai:open', {
            scope: 'text-selection',
            target: capturedSelection.component,
            textSelection: capturedSelection,
          });
          return;
        }

        if (resolved) {
          ed.trigger('builder:ai:open', resolved);
        }
      },
    });
  }

  // 3. When a component is selected, attach AI button to its toolbar
  editor.on('component:selected', (selected: Component) => {
    const resolved = resolveAgentTarget(selected);
    if (!resolved) return;

    const toolbar = selected.get('toolbar');
    const aiCommand = 'tlb-ai-edit';

    if (Array.isArray(toolbar) && toolbar.some((t: { command?: unknown }) => t.command === aiCommand)) {
      return;
    }

    const aiButton = {
      command: aiCommand,
      label: SPARKLE_ICON,
      attributes: {
        class: 'gjs-toolbar-item--ai',
        title: `Edit with AI (${resolved.scope})`,
      },
    };

    const defaultToolbar = [
      { attributes: { class: 'fa fa-arrows' }, command: 'tlb-move' },
      { attributes: { class: 'fa fa-clone' }, command: 'tlb-clone' },
      { attributes: { class: 'fa fa-trash-o' }, command: 'tlb-delete' },
    ];

    const currentToolbar = Array.isArray(toolbar) ? toolbar : defaultToolbar;
    selected.set('toolbar', [aiButton, ...currentToolbar]);
  });
};
