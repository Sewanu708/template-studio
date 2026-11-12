import React from 'react';

interface SpacingFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
}

interface ParsedSides {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export function SpacingField({
  label,
  value,
  onChange,
  helpText,
}: SpacingFieldProps) {
  const sides = parseSpacing(value);

  const handleSideChange = (side: keyof ParsedSides, rawVal: string) => {
    const formatted = formatWithUnit(rawVal);
    const nextSides = { ...sides, [side]: formatted };
    onChange(`${nextSides.top} ${nextSides.right} ${nextSides.bottom} ${nextSides.left}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>{label}</span>
        <span style={styles.unitHint}>px</span>
      </div>

      <div style={styles.boxGrid}>
        <div style={styles.boxItemTop}>
          <span style={styles.boxLabel}>Top</span>
          <input
            type="text"
            value={stripUnit(sides.top)}
            placeholder="0"
            onChange={(e) => handleSideChange('top', e.target.value)}
            style={styles.boxInput}
            aria-label="Top padding in px"
          />
        </div>

        <div style={styles.middleRow}>
          <div style={styles.boxItem}>
            <span style={styles.boxLabel}>Left</span>
            <input
              type="text"
              value={stripUnit(sides.left)}
              placeholder="0"
              onChange={(e) => handleSideChange('left', e.target.value)}
              style={styles.boxInput}
              aria-label="Left padding in px"
            />
          </div>

          <div style={styles.centerBadge}>PAD</div>

          <div style={styles.boxItem}>
            <span style={styles.boxLabel}>Right</span>
            <input
              type="text"
              value={stripUnit(sides.right)}
              placeholder="0"
              onChange={(e) => handleSideChange('right', e.target.value)}
              style={styles.boxInput}
              aria-label="Right padding in px"
            />
          </div>
        </div>

        <div style={styles.boxItemBottom}>
          <span style={styles.boxLabel}>Bottom</span>
          <input
            type="text"
            value={stripUnit(sides.bottom)}
            placeholder="0"
            onChange={(e) => handleSideChange('bottom', e.target.value)}
            style={styles.boxInput}
            aria-label="Bottom padding in px"
          />
        </div>
      </div>

      {helpText && <span style={styles.helpText}>{helpText}</span>}
    </div>
  );
}

function parseSpacing(value: string): ParsedSides {
  if (!value) return { top: '0px', right: '0px', bottom: '0px', left: '0px' };

  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const val = parts[0]!;
    return { top: val, right: val, bottom: val, left: val };
  }
  if (parts.length === 2) {
    const [tb, rl] = parts;
    return { top: tb!, right: rl!, bottom: tb!, left: rl! };
  }
  if (parts.length === 3) {
    const [t, rl, b] = parts;
    return { top: t!, right: rl!, bottom: b!, left: rl! };
  }
  if (parts.length >= 4) {
    const [t, r, b, l] = parts;
    return { top: t!, right: r!, bottom: b!, left: l! };
  }

  return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
}

function stripUnit(val: string): string {
  return val.replace(/px$/i, '').trim();
}

function formatWithUnit(val: string): string {
  const trimmed = val.trim();
  if (!trimmed || trimmed === '0') return '0px';
  if (trimmed.endsWith('px') || trimmed.endsWith('%') || trimmed.endsWith('em')) {
    return trimmed;
  }
  return `${trimmed}px`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 600,
  },
  unitHint: {
    fontSize: 11,
    color: '#9ca3af',
  },
  boxGrid: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  boxItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  boxItemBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  middleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4,
  },
  boxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  centerBadge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#9ca3af',
    border: '1px dashed #d1d5db',
    borderRadius: 3,
    padding: '2px 6px',
    userSelect: 'none',
  },
  boxLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 32,
    textAlign: 'right',
  },
  boxInput: {
    width: 44,
    height: 24,
    padding: '0 4px',
    fontSize: 11,
    textAlign: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    background: '#ffffff',
    outline: 'none',
    color: '#111827',
  },
  helpText: {
    fontSize: 10,
    color: '#9ca3af',
    lineHeight: 1.3,
  },
};
