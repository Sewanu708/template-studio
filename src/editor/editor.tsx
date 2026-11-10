import { useState } from 'react';
import GjsEditor, { Canvas } from '@grapesjs/react';
import grapesjs, { type Editor, type Plugin } from 'grapesjs';
import gjsMjmlModule from 'grapesjs-mjml';
import { editorConfig } from './config/editor-config';
import { canvasCommunicationPlugin } from './canvas/communication';
import { sectionControlsPlugin } from './canvas/section-controls';
import { emailBuilderPlugin } from './plugins/builder';
import { imageBehaviorPlugin } from './plugins/image-behavior';
import { layoutBehaviorPlugin } from './plugins/layout-behavior';
import { getCompiledHtml, getMjml } from './lib/serializer';
import { TopToolbar } from '../ui/toolbar/top-toolbar';
import { LeftSidebar } from '../ui/sidebar/left-sidebar';
import { RightInspector } from '../ui/inspector/right-inspector';

import 'grapesjs/dist/css/grapes.min.css';

// grapesjs-mjml 1.0.8 is published as UMD. Depending on the bundler's CJS
// interop, its default import is either the plugin or `{ default: plugin }`.
function isPlugin(value: unknown): value is Plugin {
  return typeof value === 'function';
}

function resolveMjmlPlugin(moduleValue: unknown): Plugin {
  if (isPlugin(moduleValue)) return moduleValue;
  if (
    moduleValue !== null
    && typeof moduleValue === 'object'
    && 'default' in moduleValue
    && isPlugin(moduleValue.default)
  ) {
    return moduleValue.default;
  }
  throw new TypeError('grapesjs-mjml did not expose a GrapesJS plugin function.');
}

const gjsMjml = resolveMjmlPlugin(gjsMjmlModule);

const configuredMjmlPlugin: Plugin = (editor) => {
  gjsMjml(editor, {
    resetBlocks: true,
    blocks: [],
    resetStyleManager: true,
    resetDevices: false,
    useCustomTheme: false,
    overwriteExport: false,
    columnsPadding: '',
  });
};

export function EmailEditor() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [templateName, setTemplateName] = useState('Untitled email');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');

  const handleEditor = (editorInstance: Editor) => {
    editorInstance.on('change:changesCount', () => setSaveStatus('unsaved'));
    setEditor(editorInstance);
  };

  const handlePreview = () => {
    if (!editor) return;
    const win = window.open('', '_blank');
    if (!win) return;

    try {
      const { html, errors = [] } = getCompiledHtml(editor);
      if (errors.length) {
        console.warn('MJML compiled with warnings:', errors);
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch (error) {
      win.close();
      alert(error instanceof Error ? error.message : 'Unable to preview this email.');
    }
  };

  const handleExportMjml = () => {
    if (!editor) return;
    downloadFile('email.mjml', getMjml(editor), 'text/plain');
  };

  const handleExportHtml = () => {
    if (!editor) return;
    try {
      const { html, errors = [] } = getCompiledHtml(editor);
      if (errors.length) {
        console.warn('MJML compiled with warnings:', errors);
      }
      downloadFile('email.html', html, 'text/html');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to compile this email.');
    }
  };

  return (
    <GjsEditor
      grapesjs={grapesjs}
      options={{
        ...editorConfig,
        plugins: [
          configuredMjmlPlugin,
          emailBuilderPlugin,
          imageBehaviorPlugin,
          layoutBehaviorPlugin,
          canvasCommunicationPlugin,
          sectionControlsPlugin,
        ],
      }}
      onEditor={handleEditor}
      style={styles.gjsRoot}
    >
      {/* Our shell lives inside GjsEditor so it shares the editor context */}
      <div style={styles.shell}>
        <TopToolbar
          editor={editor}
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          saveStatus={saveStatus}
          onPreview={handlePreview}
          onExportMjml={handleExportMjml}
          onExportHtml={handleExportHtml}
        />

        <div style={styles.workspace}>
          <LeftSidebar editor={editor} />

          <main style={styles.canvasArea}>
            {/* @grapesjs/react Canvas — renders the GrapesJS iframe */}
            <Canvas style={styles.canvas} />
          </main>

          <aside style={styles.inspector}>
            <RightInspector editor={editor} />
          </aside>
        </div>
      </div>
    </GjsEditor>
  );
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const styles: Record<string, React.CSSProperties> = {
  gjsRoot: {
    // GjsEditor renders a wrapper div — make it fill the viewport
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvasArea: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    background: '#f3f4f6',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  inspector: {
    width: 340,
    flexShrink: 0,
    background: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};
