import { useState } from 'react';
import type { Editor } from 'grapesjs';
import { BlockPanel } from '../blocks/block-panel';
import { LayerPanel } from '../layers/layer-panel';

type Tab = 'add' | 'layers';

interface LeftSidebarProps {
  editor: Editor | null;
}

export function LeftSidebar({ editor }: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('add');

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.tabs} role="tablist" aria-label="Sidebar tabs">
        {(['add', 'layers'] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'add' ? 'Add' : 'Layers'}
          </button>
        ))}
      </nav>

      <div style={styles.content} role="tabpanel">
        <div style={{ ...styles.panel, display: activeTab === 'add' ? 'block' : 'none' }}>
          <BlockPanel />
        </div>
        <div style={{ ...styles.panel, display: activeTab === 'layers' ? 'block' : 'none' }}>
          <LayerPanel editor={editor} />
        </div>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 260,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b7280',
    borderBottom: '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: '#22c55e',
    borderBottom: '2px solid #22c55e',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  panel: {
    height: '100%',
  },
};
