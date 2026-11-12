import type { Plugin } from 'grapesjs';

const LOCKED_CSS = `
  .builder-ai-locked {
    position: relative !important;
    pointer-events: none !important;
    user-select: none !important;
    outline: 2px dashed #6366f1 !important;
    outline-offset: -2px !important;
    transition: opacity 0.2s ease;
    animation: builder-ai-pulse 1.8s infinite ease-in-out !important;
  }

  @keyframes builder-ai-pulse {
    0%, 100% {
      opacity: 0.95;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

export const aiLockingPlugin: Plugin = (editor) => {
  const injectStyles = () => {
    const frame = editor.Canvas.getFrameEl();
    const doc = frame?.contentDocument ?? editor.Canvas.getDocument();
    if (!doc || doc.getElementById('builder-ai-locking-styles')) return;

    const styleEl = doc.createElement('style');
    styleEl.id = 'builder-ai-locking-styles';
    styleEl.textContent = LOCKED_CSS;
    doc.head.appendChild(styleEl);
  };

  editor.on('load', injectStyles);
  editor.on('canvas:load', injectStyles);
  editor.on('canvas:frame:load', injectStyles);
};
