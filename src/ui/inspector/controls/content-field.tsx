import React from 'react';

interface ContentFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function ContentField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = 'Enter content...',
}: ContentFieldProps) {
  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={styles.textarea}
        rows={rows}
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#4b5563',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 9px',
    fontSize: 12,
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.45,
    resize: 'vertical',
    background: '#ffffff',
  },
};
