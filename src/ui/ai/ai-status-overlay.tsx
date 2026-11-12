import React from 'react';
import type { AgentScope } from '../../editor/ai/agent-types';

interface AiStatusOverlayProps {
  scope: AgentScope;
  targetType: string;
  onCancel?: () => void;
}

export const AiStatusOverlay: React.FC<AiStatusOverlayProps> = ({
  scope,
  targetType,
  onCancel,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.badge}>
        <div style={styles.spinner} />
        <span style={styles.text}>
          AI is updating {scope === 'section' ? 'section' : targetType || 'component'}...
        </span>
        {onCancel && (
          <button type="button" onClick={onCancel} style={styles.cancelBtn}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    pointerEvents: 'auto',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#1e1b4b',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: 24,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
    fontSize: 13,
    fontWeight: 500,
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#a5b4fc',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    letterSpacing: '-0.01em',
  },
  cancelBtn: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: '#e0e7ff',
    padding: '3px 8px',
    borderRadius: 12,
    fontSize: 11,
    cursor: 'pointer',
    marginLeft: 4,
  },
};
