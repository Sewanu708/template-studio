import React, { useRef } from 'react';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
}

const PRESET_SWATCHES = [
  { label: 'Transparent', value: '' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Slate Gray', value: '#64748b' },
  { label: 'Brand Green', value: '#22c55e' },
  { label: 'Royal Blue', value: '#3b82f6' },
  { label: 'Crimson Red', value: '#ef4444' },
];

export function ColorField({
  label,
  value,
  onChange,
  placeholder = 'None',
  helpText,
}: ColorFieldProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const normalizedHex = normalizeHex(value);
  const isTransparent = !value || value.toLowerCase() === 'transparent';

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.header}>
          <label style={styles.label}>{label}</label>
          {helpText && <span style={styles.helpText} title={helpText}>ⓘ</span>}
        </div>

        <div style={styles.inputWrapper}>
          {/* Visual Swatch */}
          <button
            type="button"
            style={{
              ...styles.swatch,
              backgroundColor: isTransparent ? 'transparent' : value,
              backgroundImage: isTransparent
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : 'none',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            }}
            onClick={() => colorInputRef.current?.click()}
            title="Choose color"
            aria-label={`Choose ${label} color`}
          />

          {/* Hidden native color picker */}
          <input
            ref={colorInputRef}
            type="color"
            value={normalizedHex}
            onChange={(e) => onChange(e.target.value)}
            style={styles.hiddenColorInput}
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* Hex / string input */}
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={styles.textInput}
            aria-label={`${label} color hex`}
          />

          {/* Quick Clear / Reset button */}
          {value && (
            <button
              type="button"
              style={styles.clearBtn}
              onClick={() => onChange('')}
              title="Clear color"
              aria-label="Clear color"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Preset Swatches Palette */}
      <div style={styles.swatchesRow} aria-label="Color presets">
        {PRESET_SWATCHES.map((swatch) => (
          <button
            key={swatch.label}
            type="button"
            style={{
              ...styles.miniSwatch,
              backgroundColor: swatch.value || '#ffffff',
              border: swatch.value === '#ffffff' ? '1px solid #d1d5db' : '1px solid transparent',
              outline: value === swatch.value ? '2px solid #22c55e' : 'none',
            }}
            onClick={() => onChange(swatch.value)}
            title={swatch.label}
            aria-label={swatch.label}
          />
        ))}
      </div>
    </div>
  );
}

function normalizeHex(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return '#22c55e';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  row: {
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
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    maxWidth: 190,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 5,
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  hiddenColorInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    pointerEvents: 'none',
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    height: 28,
    padding: '4px 8px',
    fontSize: 12,
    fontFamily: 'monospace',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    outline: 'none',
    color: '#111827',
    background: '#ffffff',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 10,
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: 3,
  },
  swatchesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 108,
  },
  miniSwatch: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 0,
    transition: 'transform 100ms ease',
  },
};
