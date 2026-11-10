import { useEffect, useState } from 'react';
import { LayersProvider } from '@grapesjs/react';
import type { Editor, Component } from 'grapesjs';

interface LayerNode {
  id: string;
  label: string;
  type: string;
  depth: number;
  component: Component;
  isSelected: boolean;
  hasChildren: boolean;
}

interface LayerPanelProps {
  editor: Editor | null;
}

function flatten(
  component: Component,
  depth: number,
  selectedId: string | null,
): LayerNode[] {
  const id = component.getId();
  const type = component.get('type') as string;
  const customName = component.get('custom-name') as string | undefined;
  const label = customName ?? type ?? 'element';
  const children = component.components();
  const hasChildren = children.length > 0;

  const node: LayerNode = {
    id,
    label,
    type,
    depth,
    component,
    isSelected: selectedId === id,
    hasChildren,
  };

  const childNodes: LayerNode[] = [];
  children.each((c: Component) => {
    flatten(c, depth + 1, selectedId).forEach((n) => childNodes.push(n));
  });

  return [node, ...childNodes];
}

export function LayerPanel({ editor }: LayerPanelProps) {
  return (
    <LayersProvider>
      {({ root }) => <LayerPanelContent editor={editor} root={root} />}
    </LayersProvider>
  );
}

interface LayerPanelContentProps extends LayerPanelProps {
  root?: Component;
}

function LayerPanelContent({ editor, root }: LayerPanelContentProps) {
  const [nodes, setNodes] = useState<LayerNode[]>([]);

  const refresh = () => {
    if (!editor || !root) return;
    const selected = editor.getSelected();
    const sid = selected ? selected.getId() : null;
    const firstLevel: LayerNode[] = [];
    const type = String(root.get('type'));

    if (type === 'wrapper') {
      root.components().each((component: Component) => {
        firstLevel.push(...flatten(component, 0, sid));
      });
    } else {
      firstLevel.push(...flatten(root, 0, sid));
    }
    setNodes(firstLevel);
  };

  useEffect(() => {
    if (!editor || !root) return;
    editor.on('component:add component:remove component:update component:selected', refresh);
    refresh();
    return () => {
      editor.off('component:add component:remove component:update component:selected', refresh);
    };
  }, [editor, root]);

  const handleSelect = (node: LayerNode) => {
    editor?.select(node.component);
  };

  const handleDelete = (e: React.MouseEvent, node: LayerNode) => {
    e.stopPropagation();
    const type = node.type;
    if (type === 'mjml' || type === 'mj-body' || type === 'mj-head') return;
    node.component.remove();
  };

  const handleDuplicate = (e: React.MouseEvent, node: LayerNode) => {
    e.stopPropagation();
    const parent = node.component.parent();
    if (!parent) return;
    const [copy] = parent.append(node.component.clone(), { at: node.component.index() + 1 });
    if (copy) editor?.select(copy);
  };

  return (
    <div style={styles.panel}>
      <div style={styles.list}>
        {nodes.map((node) => (
          <div
            key={node.id}
            style={{
              ...styles.row,
              paddingLeft: 10 + node.depth * 14,
              background: node.isSelected ? '#f0fdf4' : 'transparent',
              borderLeft: node.isSelected ? '2px solid #22c55e' : '2px solid transparent',
            }}
            onClick={() => handleSelect(node)}
            role="button"
            tabIndex={0}
            aria-label={`Select ${node.label}`}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(node)}
          >
            <span style={styles.typeIcon}>{getTypeIcon(node.type)}</span>
            <span style={styles.label}>{node.label}</span>
            <div style={styles.actions}>
              {node.type !== 'mjml' && node.type !== 'mj-body' && node.type !== 'mj-head' && (
                <>
                  <button
                    style={styles.actionBtn}
                    onClick={(e) => handleDuplicate(e, node)}
                    title="Duplicate"
                    aria-label={`Duplicate ${node.label}`}
                  >
                    ⧉
                  </button>
                  <button
                    style={{ ...styles.actionBtn, color: '#ef4444' }}
                    onClick={(e) => handleDelete(e, node)}
                    title="Delete"
                    aria-label={`Delete ${node.label}`}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {nodes.length === 0 && (
          <p style={styles.empty}>No components yet. Drop a block onto the canvas.</p>
        )}
      </div>
    </div>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    mjml: '📄',
    'mj-head': '⚙',
    'mj-body': '▣',
    'mj-section': '▤',
    'mj-column': '▥',
    'mj-text': 'T',
    'mj-image': '🖼',
    'mj-button': '⬭',
    'mj-divider': '—',
    'mj-spacer': '↕',
    'mj-social': '⊕',
  };
  return icons[type] ?? '◻';
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: 13,
    color: '#374151',
    transition: 'background 0.1s',
  },
  typeIcon: {
    fontSize: 13,
    width: 16,
    textAlign: 'center',
    flexShrink: 0,
    color: '#6b7280',
  },
  label: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actions: {
    display: 'flex',
    gap: 2,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: 12,
    color: '#9ca3af',
    borderRadius: 3,
  },
  empty: {
    padding: 16,
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
};
