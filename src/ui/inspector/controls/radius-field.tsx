import React from 'react';

interface RadiusFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  clientWarning?: string;
}

interface ParsedCorners {
  topLeft: string;
  topRight: string;
  bottomRight: string;
  bottomLeft: string;
}

export function RadiusField({
  label,
  value,
  onChange,
  clientWarning,
}: RadiusFieldProps) {
  const corners = parseRadius(value);

  const handleCornerChange = (corner: keyof ParsedCorners, rawVal: string) => {
    const formatted = formatWithPx(rawVal);
    const next = { ...corners, [corner]: formatted };
    onChange(`${next.topLeft} ${next.topRight} ${next.bottomRight} ${next.bottomLeft}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>{label}</span>
        <span style={styles.unitHint}>px</span>
      </div>

      <div style={styles.grid}>
        <div style={styles.cornerItem}>
          <span style={styles.cornerLabel}>TL</span>
          <input
            type="text"
            value={stripPx(corners.topLeft)}
            placeholder="0"
            onChange={(e) => handleCornerChange('topLeft', e.target.value)}
            style={styles.cornerInput}
            aria-label="Top-left radius in px"
          />
        </div>
        <div style={styles.cornerItem}>
          <span style={styles.cornerLabel}>TR</span>
          <input
            type="text"
            value={stripPx(corners.topRight)}
            placeholder="0"
            onChange={(e) => handleCornerChange('topRight', e.target.value)}
            style={styles.cornerInput}
            aria-label="Top-right radius in px"
          />
        </div>
        <div style={styles.cornerItem}>
          <span style={styles.cornerLabel}>BL</span>
          <input
            type="text"
            value={stripPx(corners.bottomLeft)}
            placeholder="0"
            onChange={(e) => handleCornerChange('bottomLeft', e.target.value)}
            style={styles.cornerInput}
            aria-label="Bottom-left radius in px"
          />
        </div>
        <div style={styles.cornerItem}>
          <span style={styles.cornerLabel}>BR</span>
          <input
            type="text"
            value={stripPx(corners.bottomRight)}
            placeholder="0"
            onChange={(e) => handleCornerChange('bottomRight', e.target.value)}
            style={styles.cornerInput}
            aria-label="Bottom-right radius in px"
          />
        </div>
      </div>

      {clientWarning && (
        <div style={styles.warningBox}>
          <span style={styles.warningIcon}>⚠️</span>
          <span style={styles.warningText}>{clientWarning}</span>
        </div>
      )}
    </div>
  );
}

function parseRadius(value: string): ParsedCorners {
  if (!value) return { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' };

  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const v = parts[0]!;
    return { topLeft: v, topRight: v, bottomRight: v, bottomLeft: v };
  }
  if (parts.length === 2) {
    const [tlbr, trbl] = parts;
    return { topLeft: tlbr!, topRight: trbl!, bottomRight: tlbr!, bottomLeft: trbl! };
  }
  if (parts.length === 3) {
    const [tl, trbl, br] = parts;
    return { topLeft: tl!, topRight: trbl!, bottomRight: br!, bottomLeft: trbl! };
  }
  if (parts.length >= 4) {
    const [tl, tr, br, bl] = parts;
    return { topLeft: tl!, topRight: tr!, bottomRight: br!, bottomLeft: bl! };
  }

  return { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' };
}

function stripPx(val: string): string {
  return val.replace(/px$/i, '').trim();
}

function formatWithPx(val: string): string {
  const trimmed = val.trim();
  if (!trimmed || trimmed === '0') return '0px';
  if (trimmed.endsWith('px') || trimmed.endsWith('%')) return trimmed;
  return `${trimmed}px`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  cornerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  cornerLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#6b7280',
    width: 20,
  },
  cornerInput: {
    flex: 1,
    height: 24,
    padding: '0 4px',
    fontSize: 11,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    background: '#ffffff',
    outline: 'none',
    color: '#111827',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    padding: '6px 8px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 4,
    marginTop: 2,
  },
  warningIcon: {
    fontSize: 12,
    lineHeight: 1.2,
  },
  warningText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 1.3,
  },
};
