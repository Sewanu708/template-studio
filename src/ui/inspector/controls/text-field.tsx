import React from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  actionLabel?: string;
  actionTitle?: string;
  onAction?: () => void;
  onClear?: () => void;
  isTextarea?: boolean;
  isUrl?: boolean;
  placeholder?: string;
  helpText?: string;
}

export function TextField({
  label,
  value,
  onChange,
  actionLabel,
  actionTitle,
  onAction,
  onClear,
  isTextarea = false,
  isUrl = false,
  placeholder,
  helpText,
}: TextFieldProps) {
  return (
    <div
      style={{
        ...styles.container,
        alignItems: isTextarea ? 'flex-start' : 'center',
      }}
    >
      <div style={styles.header}>
        <label style={styles.label}>{label}</label>
        {helpText && <span style={styles.helpText} title={helpText}>ⓘ</span>}
      </div>

      <div style={styles.inputWrapper}>
        {isTextarea ? (
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={styles.textarea}
            rows={3}
            aria-label={label}
          />
        ) : (
          <div style={styles.singleRow}>
            {isUrl && <span style={styles.urlPrefix}>🔗</span>}
            <input
              type={isUrl ? 'url' : 'text'}
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(e.target.value)}
              style={styles.input}
              aria-label={label}
            />
            {onClear && value && (
              <button
                type="button"
                style={styles.clearButton}
                onClick={onClear}
                title={`Remove ${label}`}
                aria-label={`Remove ${label}`}
              >
                ✕
              </button>
            )}
            {onAction && (
              <button
                type="button"
                style={styles.actionButton}
                onClick={onAction}
                title={actionTitle}
                aria-label={actionTitle ?? actionLabel}
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
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
    paddingTop: 4,
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
  inputWrapper: {
    flex: 1,
    maxWidth: 190,
  },
  singleRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    background: '#ffffff',
    height: 28,
    overflow: 'hidden',
  },
  urlPrefix: {
    padding: '0 4px 0 6px',
    fontSize: 10,
    color: '#9ca3af',
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: '0 8px',
    fontSize: 12,
    color: '#111827',
    border: 'none',
    outline: 'none',
    background: 'transparent',
  },
  clearButton: {
    alignSelf: 'stretch',
    padding: '0 7px',
    border: 'none',
    borderLeft: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  actionButton: {
    alignSelf: 'stretch',
    padding: '0 8px',
    border: 'none',
    borderLeft: '1px solid #e5e7eb',
    background: '#f9fafb',
    color: '#16a34a',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12,
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    background: '#ffffff',
  },
};
