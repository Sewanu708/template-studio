import React from 'react';
import type { FieldOption } from '../../../editor/components/schemas/component-schema';

interface SelectFieldProps {
  label: string;
  value: string;
  options: FieldOption[];
  onChange: (value: string) => void;
  isFont?: boolean;
  helpText?: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  isFont = false,
  helpText,
}: SelectFieldProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <label style={styles.label}>{label}</label>
        {helpText && <span style={styles.helpText} title={helpText}>ⓘ</span>}
      </div>

      <div style={styles.selectWrapper}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...styles.select,
            fontFamily: isFont && value ? value : 'inherit',
          }}
          aria-label={label}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ fontFamily: isFont ? opt.value : 'inherit' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <span style={styles.chevron}>▾</span>
      </div>
    </div>
  );
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
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    maxWidth: 190,
  },
  select: {
    width: '100%',
    height: 28,
    padding: '0 24px 0 8px',
    fontSize: 12,
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  chevron: {
    position: 'absolute',
    right: 8,
    pointerEvents: 'none',
    fontSize: 10,
    color: '#9ca3af',
  },
};
