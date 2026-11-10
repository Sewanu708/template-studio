import React from 'react';

interface ControlRowProps {
  label: string;
  helpText?: string;
  children: React.ReactNode;
  align?: 'center' | 'start';
}

export function ControlRow({
  label,
  helpText,
  children,
  align = 'center',
}: ControlRowProps) {
  return (
    <div
      style={{
        ...styles.row,
        alignItems: align === 'start' ? 'flex-start' : 'center',
      }}
    >
      <div style={styles.header}>
        <label style={styles.label}>{label}</label>
        {helpText && (
          <span style={styles.helpText} title={helpText}>
            i
          </span>
        )}
      </div>

      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
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
    paddingTop: 6,
  },
  label: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: 500,
  },
  helpText: {
    display: 'inline-grid',
    placeItems: 'center',
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '1px solid #d1d5db',
    fontSize: 10,
    lineHeight: 1,
    color: '#9ca3af',
    cursor: 'help',
  },
  content: {
    flex: 1,
    minWidth: 0,
    maxWidth: 190,
  },
};
