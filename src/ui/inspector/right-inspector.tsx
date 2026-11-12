import React, { useEffect, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { getComponentSchema } from '../../editor/components/definitions/registry';
import {
  applySectionColumnGap,
  getSectionColumnGapValue,
  SECTION_COLUMN_GAP_FIELD,
} from '../../editor/layout/column-gap';
import { ContentField } from './controls/content-field';
import { FieldRenderer } from './controls/field-renderer';
import { ImageSettingsPanel } from './panels/image-settings-panel';

const BOX_BORDER_ATTRS = [
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
];

const LEGACY_BORDER_PART_ATTRS = [
  'border-width',
  'border-style',
  'border-color',
];

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

  const inspectable = getInspectableComponent(selected);
  const rawType = inspectable.get('type') as string;
  const tagName = String(inspectable.get('tagName') ?? '');
  const type = rawType === 'wrapper' ? 'mj-body' : (rawType || tagName);
  const schema = getComponentSchema(type);
  const displayName = inspectable.get('custom-name') || schema?.label || type || 'Component';
  const attrs = inspectable.getAttributes() as Record<string, string>;
  const stylesObj = (inspectable.getStyle() ?? {}) as Record<string, string>;

  const handleAttrChange = (attrName: string, nextValue: string) => {
    if (!inspectable) return;

    if (type === 'mj-section' && attrName === SECTION_COLUMN_GAP_FIELD) {
      applySectionColumnGap(inspectable, nextValue);
      setRevision((rev) => rev + 1);
      return;
    }

    const attrsToRemove = getConflictingAttributesForChange(type, attrName);
    const shouldRemoveAttr = (
      nextValue === ''
      || nextValue === undefined
      || isEmptyBoxBorderValue(type, attrName, nextValue)
    );

    if (shouldRemoveAttr) {
      attrsToRemove.push(attrName);
    }

    if (attrsToRemove.length) {
      inspectable.removeAttributes([...new Set(attrsToRemove)]);
    }

    if (!shouldRemoveAttr) {
      inspectable.addAttributes({ [attrName]: nextValue });
    }

    setRevision((rev) => rev + 1);
  };

  const handleAttrsChange = (updates: Record<string, string>) => {
    if (!inspectable) return;

    const attrsToRemove: string[] = [];
    const attrsToAdd: Record<string, string> = {};

    Object.entries(updates).forEach(([attrName, nextValue]) => {
      if (nextValue === '' || nextValue === undefined) {
        attrsToRemove.push(attrName);
      } else {
        attrsToAdd[attrName] = nextValue;
      }
    });

    if (attrsToRemove.length) inspectable.removeAttributes(attrsToRemove);
    if (Object.keys(attrsToAdd).length) inspectable.addAttributes(attrsToAdd);

    setRevision((rev) => rev + 1);
  };

  const handleContentChange = (newContent: string) => {
    if (!inspectable) return;
    inspectable.components(newContent);
    setRevision((rev) => rev + 1);
  };

  // Determine if component supports text content editing
  const hasTextContent = type === 'mj-text' || type === 'mj-button';
  const currentContent = hasTextContent ? getComponentContent(inspectable) : '';
  const isImage = type === 'mj-image';

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
          <section style={styles.group}>
            <div style={styles.groupLabel}>Content</div>
            <div style={styles.fields}>
              <ContentField
                label={type === 'mj-button' ? 'Button Label' : 'Text Content'}
                value={currentContent}
                onChange={handleContentChange}
                rows={type === 'mj-button' ? 2 : 5}
                placeholder={type === 'mj-button' ? 'Enter button label...' : 'Enter text...'}
              />
            </div>
          </section>
        )}

        {isImage && editor && (
          <ImageSettingsPanel
            component={inspectable}
            editor={editor}
            attrs={attrs}
            onChange={handleAttrChange}
            onAttrsChange={handleAttrsChange}
            onRefresh={() => setRevision((rev) => rev + 1)}
          />
        )}

        {/* Schema Groups */}
        {schema ? (
          schema.groups.filter(() => (
            !isImage
          )).map((group) => (
            <section key={group.id} style={styles.group}>
              <div style={styles.groupLabel}>{group.label}</div>
              <div style={styles.fields}>
                {group.fields.map((field) => {
                  const currentValue = (
                    type === 'mj-section' && field.name === SECTION_COLUMN_GAP_FIELD
                      ? getSectionColumnGapValue(inspectable)
                      : attrs[field.name] ?? stylesObj[field.name]
                  );
                  return (
                    <FieldRenderer
                      key={field.name}
                      field={field}
                      value={currentValue}
                      onChange={(nextVal) => handleAttrChange(field.name, nextVal)}
                      editor={editor}
                      attrs={attrs}
                      onAttrsChange={handleAttrsChange}
                    />
                  );
                })}
              </div>
            </section>
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

function getComponentType(component: Component): string {
  return String(component.get('type') ?? component.get('tagName') ?? '');
}

function isBoxBorderAttribute(type: string, attrName: string): boolean {
  return type !== 'mj-divider' && BOX_BORDER_ATTRS.includes(attrName);
}

function isEmptyBoxBorderValue(type: string, attrName: string, value: string): boolean {
  return isBoxBorderAttribute(type, attrName) && value === 'none';
}

function getConflictingAttributesForChange(type: string, attrName: string): string[] {
  if (type === 'mj-divider') return [];

  if (attrName === 'border') {
    return [
      ...BOX_BORDER_ATTRS.filter((name) => name !== 'border'),
      ...LEGACY_BORDER_PART_ATTRS,
    ];
  }

  if (BOX_BORDER_ATTRS.includes(attrName)) {
    return [
      'border',
      ...LEGACY_BORDER_PART_ATTRS,
    ];
  }

  if (LEGACY_BORDER_PART_ATTRS.includes(attrName)) {
    return ['border'];
  }

  return [];
}

function getInspectableComponent(component: Component): Component {
  const type = getComponentType(component);
  const parent = component.parent();

  if (
    type === 'text'
    && parent
    && (parent.is('mj-text') || parent.is('mj-button'))
  ) {
    return parent;
  }

  if (!getComponentSchema(type) && parent) {
    const parentType = getComponentType(parent);
    if (getComponentSchema(parentType)) {
      return parent;
    }
  }

  return component;
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
  },
  fields: {
    padding: '4px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
