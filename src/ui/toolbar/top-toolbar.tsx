import { useState } from 'react';
import type { Editor } from 'grapesjs';

interface TopToolbarProps {
  editor: Editor | null;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  onPreview: () => void;
  onExportMjml: () => void;
  onExportHtml: () => void;
  onOpenAi: () => void;
}

export function TopToolbar({
  editor,
  templateName,
  onTemplateNameChange,
  saveStatus,
  onPreview,
  onExportMjml,
  onExportHtml,
  onOpenAi,
}: TopToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop');

  const selectDevice = (nextDevice: 'Desktop' | 'Mobile') => {
    editor?.setDevice(nextDevice);
    setDevice(nextDevice);
  };

  const runExport = (callback: () => void) => {
    setExportOpen(false);
    callback();
  };

  const statusLabel: Record<TopToolbarProps['saveStatus'], string> = {
    saved: '✓ Saved',
    saving: '↻ Saving…',
    error: '✕ Save failed',
    unsaved: '● Unsaved',
  };

  const statusColor: Record<TopToolbarProps['saveStatus'], string> = {
    saved: '#22c55e',
    saving: '#f59e0b',
    error: '#ef4444',
    unsaved: '#94a3b8',
  };

  return (
    <header style={styles.toolbar}>
      {/* Left */}
      <div style={styles.group}>
        <button style={styles.iconBtn} title="Back to projects">←</button>
        <input
          style={styles.nameInput}
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          aria-label="Template name"
        />
        <span style={{ ...styles.status, color: statusColor[saveStatus] }}>
          {statusLabel[saveStatus]}
        </span>
        <button
          style={styles.iconBtn}
          title="Undo"
          onClick={() => editor?.UndoManager.undo()}
        >
          ↩
        </button>
        <button
          style={styles.iconBtn}
          title="Redo"
          onClick={() => editor?.UndoManager.redo()}
        >
          ↪
        </button>
      </div>

      {/* Center — viewport switcher */}
      <div style={styles.group}>
        <button
          style={{ ...styles.deviceBtn, ...(device === 'Desktop' ? styles.deviceBtnActive : {}) }}
          title="Desktop view"
          aria-pressed={device === 'Desktop'}
          onClick={() => selectDevice('Desktop')}
        >
          Desktop
        </button>
        <button
          style={{ ...styles.deviceBtn, ...(device === 'Mobile' ? styles.deviceBtnActive : {}) }}
          title="Mobile view"
          aria-pressed={device === 'Mobile'}
          onClick={() => selectDevice('Mobile')}
        >
          Mobile
        </button>
      </div>

      {/* Right */}
      <div style={styles.group}>
        <button style={styles.aiBtn} onClick={onOpenAi} title="Generate with AI">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          AI
        </button>
        <button style={styles.secondaryBtn} onClick={onPreview}>Preview</button>
        <div style={styles.exportMenu}>
          <button
            style={styles.primaryBtn}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            onClick={() => setExportOpen((open) => !open)}
          >
            Export ▾
          </button>
          {exportOpen && (
            <div style={styles.dropdown} role="menu">
              <button style={styles.dropdownItem} role="menuitem" onClick={() => runExport(onExportMjml)}>Download MJML</button>
              <button style={styles.dropdownItem} role="menuitem" onClick={() => runExport(onExportHtml)}>Download HTML</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    padding: '0 12px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
    gap: 8,
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  nameInput: {
    fontSize: 14,
    fontWeight: 500,
    color: '#111827',
    border: '1px solid transparent',
    borderRadius: 4,
    padding: '2px 6px',
    background: 'transparent',
    outline: 'none',
    minWidth: 140,
  },
  status: {
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 14,
    color: '#374151',
  },
  secondaryBtn: {
    background: 'none',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    padding: '5px 12px',
    borderRadius: 4,
    fontSize: 13,
    color: '#374151',
  },
  deviceBtn: {
    background: 'transparent',
    border: 'none',
    borderRadius: 999,
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: 12,
    padding: '6px 12px',
  },
  deviceBtnActive: {
    background: '#ecfdf5',
    color: '#15803d',
    fontWeight: 600,
  },
  primaryBtn: {
    background: '#22c55e',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 14px',
    borderRadius: 4,
    fontSize: 13,
    color: '#ffffff',
    fontWeight: 600,
  },
  exportMenu: {
    position: 'relative',
    display: 'inline-block',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    zIndex: 100,
    minWidth: 160,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    textAlign: 'left',
  },
  aiBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 13,
    color: '#ffffff',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(99, 102, 241, 0.2)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  },
};
