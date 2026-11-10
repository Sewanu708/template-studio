import React from 'react';
import type { FieldOption } from '../../../editor/components/schemas/component-schema';

interface SegmentedFieldProps {
  label: string;
  value: string;
  options: FieldOption[];
  onChange: (value: string) => void;
  helpText?: string;
}

export function SegmentedField({
  label,
  value,
  options,
  onChange,
  helpText,
}: SegmentedFieldProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <label style={styles.label}>{label}</label>
        {helpText && <span style={styles.helpText} title={helpText}>ⓘ</span>}
      </div>
      <div style={styles.group} role="group" aria-label={label}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              style={{
                ...styles.button,
                ...(isSelected ? styles.buttonActive : {}),
              }}
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              title={opt.title ?? opt.label}
            >
              {opt.icon ? renderIcon(opt.icon) : opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function renderIcon(icon: string) {
  switch (icon) {
    case 'left':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      );
    case 'center':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      );
    case 'right':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="6" y1="18" x2="21" y2="18" />
        </svg>
      );
    case 'justify':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
    case 'top':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="4" x2="20" y2="4" strokeWidth="2.5" />
          <rect x="8" y="8" width="8" height="12" rx="1" />
        </svg>
      );
    case 'middle':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2.5" />
          <rect x="8" y="6" width="8" height="12" rx="1" />
        </svg>
      );
    case 'bottom':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="20" x2="20" y2="20" strokeWidth="2.5" />
          <rect x="8" y="4" width="8" height="12" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
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
  group: {
    display: 'flex',
    background: '#f3f4f6',
    padding: 2,
    borderRadius: 6,
    gap: 2,
    flex: 1,
    maxWidth: 200,
    border: '1px solid #e5e7eb',
  },
  button: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 6px',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 120ms ease',
    minHeight: 24,
  },
  buttonActive: {
    background: '#ffffff',
    color: '#16a34a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontWeight: 600,
  },
};
