import React, { useRef } from 'react';
import { BORDER_STYLE_OPTIONS } from '../../../editor/components/definitions/common';

interface BorderFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
}

interface ParsedBorder {
  width: string;
  style: string;
  color: string;
}

export function BorderField({
  label,
  value,
  onChange,
  helpText,
}: BorderFieldProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const parsed = parseBorder(value);

  const update = (partial: Partial<ParsedBorder>) => {
    const next = { ...parsed, ...partial };
    if (next.style === 'none' || next.width === '0px') {
      onChange('none');
      return;
    }
    const color = next.color || '#e5e7eb';
    const width = next.width || '1px';
    const style = next.style || 'solid';
    onChange(`${width} ${style} ${color}`);
  };

  const isNone = parsed.style === 'none' || value === 'none' || !value;

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.header}>
          <label style={styles.label}>{label}</label>
          {helpText && <span style={styles.helpText} title={helpText}>ⓘ</span>}
        </div>

        <div style={styles.controlsGroup}>
          {/* Style Selector */}
          <select
            value={parsed.style}
            onChange={(e) => update({ style: e.target.value })}
            style={styles.styleSelect}
            aria-label={`${label} style`}
          >
            {BORDER_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {!isNone && (
            <>
              {/* Width */}
              <input
                type="text"
                value={parsed.width.replace('px', '')}
                placeholder="1"
                onChange={(e) => update({ width: `${e.target.value || 1}px` })}
                style={styles.widthInput}
                aria-label={`${label} width in px`}
              />
              <span style={styles.unitSuffix}>px</span>

              {/* Color Swatch */}
              <button
                type="button"
                style={{
                  ...styles.swatch,
                  backgroundColor: parsed.color || '#e5e7eb',
                }}
                onClick={() => colorInputRef.current?.click()}
                title="Choose border color"
                aria-label="Choose border color"
              />
              <input
                ref={colorInputRef}
                type="color"
                value={normalizeHex(parsed.color)}
                onChange={(e) => update({ color: e.target.value })}
                style={styles.hiddenColorInput}
                tabIndex={-1}
                aria-hidden="true"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function parseBorder(val: string): ParsedBorder {
  if (!val || val === 'none') {
    return { width: '1px', style: 'none', color: '#e5e7eb' };
  }

  const parts = val.trim().split(/\s+/);
  let width = '1px';
  let style = 'solid';
  let color = '#e5e7eb';

  parts.forEach((p) => {
    if (/^\d+(?:px)?$/i.test(p)) {
      width = p.endsWith('px') ? p : `${p}px`;
    } else if (['solid', 'dashed', 'dotted', 'double', 'none'].includes(p.toLowerCase())) {
      style = p.toLowerCase();
    } else if (p.startsWith('#') || p.startsWith('rgb')) {
      color = p;
    }
  });

  return { width, style, color };
}

function normalizeHex(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return '#e5e7eb';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 100,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: 500,
  },
  helpText: {
    fontSize: 11,
    color: '#9ca3af',
    cursor: 'help',
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    maxWidth: 190,
  },
  styleSelect: {
    flex: 1,
    minWidth: 0,
    height: 28,
    padding: '0 6px',
    fontSize: 11,
    border: '1px solid #d1d5db',
    borderRadius: 5,
    background: '#ffffff',
    color: '#111827',
    outline: 'none',
  },
  widthInput: {
    width: 32,
    height: 28,
    padding: '0 4px',
    fontSize: 11,
    textAlign: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    background: '#ffffff',
    outline: 'none',
    color: '#111827',
  },
  unitSuffix: {
    fontSize: 10,
    color: '#9ca3af',
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 4,
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    flexShrink: 0,
  },
  hiddenColorInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    pointerEvents: 'none',
  },
};
