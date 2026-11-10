import React from 'react';

interface SwitchFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  helpText?: string;
}

export function SwitchField({
  label,
  value,
  onChange,
  helpText,
}: SwitchFieldProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <label style={styles.label}>{label}</label>
        {helpText && <span style={styles.helpText} title={helpText}>ⓘ</span>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        style={{
          ...styles.track,
          backgroundColor: value ? '#22c55e' : '#e5e7eb',
        }}
        onClick={() => onChange(!value)}
      >
        <div
          style={{
            ...styles.thumb,
            transform: value ? 'translateX(16px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
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
  track: {
    width: 36,
    height: 20,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 150ms ease',
    padding: 0,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 150ms ease',
  },
};
