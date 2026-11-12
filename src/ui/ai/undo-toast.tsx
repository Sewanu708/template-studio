import React, { useEffect } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onDismiss,
  duration = 8000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div style={styles.toast}>
      <div style={styles.icon}>✓</div>
      <div style={styles.message}>{message}</div>
      <button
        type="button"
        onClick={() => {
          onUndo();
          onDismiss();
        }}
        style={styles.undoBtn}
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        style={styles.dismissBtn}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: 8,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow:
      '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
    zIndex: 2000,
    fontSize: 13,
    fontFamily: 'Inter, system-ui, sans-serif',
    animation: 'slideUp 0.2s ease-out',
  },
  icon: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 14,
  },
  message: {
    fontWeight: 400,
  },
  undoBtn: {
    backgroundColor: '#374151',
    border: '1px solid #4b5563',
    color: '#60a5fa',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: 12,
    lineHeight: 1,
  },
};
