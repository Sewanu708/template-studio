import React, { useEffect, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { getComponentSchema } from '../../editor/components/definitions/registry';
import { FieldRenderer } from './controls/field-renderer';

interface RightInspectorProps {
  editor: Editor | null;
}

export function RightInspector({ editor }: RightInspectorProps) {
  const [selected, setSelected] = useState<Component | null>(null);
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const syncSelection = () => {
      setSelected(editor.getSelected() ?? null);
    };

    const refresh = () => setRevision((rev) => rev + 1);

    editor.on('component:selected component:deselected', syncSelection);
    editor.on('component:update component:style:update', refresh);
    syncSelection();

    return () => {
      editor.off('component:selected component:deselected', syncSelection);
      editor.off('component:update component:style:update', refresh);
    };
  }, [editor]);

  if (!selected) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <span style={styles.componentType}>No Selection</span>
        </div>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>↖</div>
          <p style={styles.emptyTitle}>Select a component</p>
          <p style={styles.emptyDesc}>Click on any element in the email canvas to edit its content and styling.</p>
        </div>
      </div>
    );
  }

  const rawType = selected.get('type') as string;
  const tagName = String(selected.get('tagName') ?? '');
  const type = rawType === 'wrapper' ? 'mj-body' : (rawType || tagName);
  const schema = getComponentSchema(type);
  const displayName = selected.get('custom-name') || schema?.label || type || 'Component';
  const attrs = selected.getAttributes() as Record<string, string>;
  const stylesObj = (selected.getStyle() ?? {}) as Record<string, string>;

  const handleAttrChange = (attrName: string, nextValue: string) => {
    if (!selected) return;

    if (nextValue === '' || nextValue === undefined) {
      const updated = { ...selected.getAttributes() };
      delete updated[attrName];
      selected.set('attributes', updated);
    } else {
      selected.addAttributes({ [attrName]: nextValue });
    }

    setRevision((rev) => rev + 1);
  };

  const handleContentChange = (newContent: string) => {
    if (!selected) return;
    selected.components(newContent);
    setRevision((rev) => rev + 1);
  };

  // Determine if component supports text content editing
  const hasTextContent = type === 'mj-text' || type === 'mj-button';
  const currentContent = hasTextContent ? getComponentContent(selected) : '';

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <span style={styles.componentBadge}>{type}</span>
          <span style={styles.componentType}>{displayName}</span>
        </div>
      </div>

      <div style={styles.scrollArea}>
        {/* Quick Text Content Editor */}
        {hasTextContent && (
          <details open style={styles.group}>
            <summary style={styles.groupLabel}>
              <span>Content</span>
              <span style={styles.groupChevron}>▾</span>
            </summary>
            <div style={styles.fields}>
              <div style={styles.contentFieldRow}>
                <label style={styles.contentFieldLabel}>
                  {type === 'mj-button' ? 'Button Label' : 'Text Content'}
                </label>
                <textarea
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  style={styles.contentTextarea}
                  rows={type === 'mj-button' ? 2 : 4}
                  placeholder="Enter text..."
                />
              </div>
            </div>
          </details>
        )}

        {/* Schema Groups */}
        {schema ? (
          schema.groups.map((group) => (
            <details
              key={group.id}
              open={group.defaultOpen ?? true}
              style={styles.group}
            >
              <summary style={styles.groupLabel}>
                <span>{group.label}</span>
                <span style={styles.groupChevron}>▾</span>
              </summary>
              <div style={styles.fields}>
                {group.fields.map((field) => {
                  const currentValue = attrs[field.name] ?? stylesObj[field.name];
                  return (
                    <FieldRenderer
                      key={field.name}
                      field={field}
                      value={currentValue}
                      onChange={(nextVal) => handleAttrChange(field.name, nextVal)}
                    />
                  );
                })}
              </div>
            </details>
          ))
        ) : (
          <div style={styles.unsupportedNotice}>
            <p>No predefined styling schema for <code>{type}</code>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getComponentContent(component: Component): string {
  const content = component.get('content') as string;
  if (content) return content;
  const innerHtml = component.toHTML?.() ?? '';
  // Strip outer HTML tags to retrieve raw text/markup
  return innerHtml.replace(/^<[^>]+>|<\/[^>]+>$/g, '').trim();
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
    flexShrink: 0,
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  componentBadge: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '2px 6px',
    borderRadius: 4,
  },
  componentType: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
  },
  group: {
    borderBottom: '1px solid #f3f4f6',
  },
  groupLabel: {
    padding: '10px 16px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6b7280',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    listStyle: 'none',
  },
  groupChevron: {
    fontSize: 10,
    color: '#9ca3af',
  },
  fields: {
    padding: '4px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  contentFieldRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  contentFieldLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#4b5563',
  },
  contentTextarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    fontSize: 12,
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    resize: 'vertical',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 32,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 4px',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.4,
  },
  unsupportedNotice: {
    padding: 20,
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
};
