import type { EditorConfig } from 'grapesjs';
import { canvasCommunicationCss } from '../canvas/communication';

/**
 * GrapesJS editor configuration.
 * All default panels, managers, and UI are disabled — our React shell
 * owns the entire interface.
 */
export const editorConfig: EditorConfig = {
  panels: { defaults: [] },

  // The React toolbar owns device switching. Without this, GrapesJS injects
  // its own device buttons into the canvas.
  showDevices: false,

  // Editor-only visual language. This CSS is injected into the canvas iframe
  // and is never included in exported MJML or compiled HTML.
  canvasCss: canvasCommunicationCss,

  // A real MJML tree is required before blocks have a valid drop target.
  components: `<mjml>
  <mj-head></mj-head>
  <mj-body background-color="#ffffff">
    <mj-section background-color="#ffffff" padding-top="20px" padding-right="0px" padding-bottom="20px" padding-left="0px">
      <mj-column padding="0px">
        <mj-text align="center" color="#6b7280" font-size="16px" padding-top="10px" padding-right="0px" padding-bottom="10px" padding-left="0px">
          Start with this text or drag a block from the Add panel.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,

  blockManager: { appendTo: undefined },

  styleManager: {
    appendTo: undefined,
    sectors: [],
  },

  layerManager: { appendTo: undefined },

  traitManager: { appendTo: undefined },

  assetManager: {
    upload: false,
    showUrlInput: true,
    noAssets: 'No images yet. Upload one or paste a URL.',
    assets: [],
  },

  // Persistence is handled by our own service layer
  storageManager: false,

  undoManager: true,

  richTextEditor: {
    actions: [
      'bold',
      'italic',
      'underline',
      'link',
    ],
  },

  deviceManager: {
    devices: [
      { name: 'Desktop', width: '' },
      { name: 'Mobile', width: '375px', widthMedia: '480px' },
    ],
  },
};
