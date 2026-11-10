import React from 'react';

interface SliderControlProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function SliderControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  disabled = false,
  ariaLabel,
}: SliderControlProps) {
  const safeValue = clampNumber(value, min, max);

  const handleChange = (rawValue: string) => {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) return;
    onChange(clampNumber(nextValue, min, max));
  };

  return (
    <div style={styles.container}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        style={styles.slider}
        aria-label={ariaLabel}
      />

      <div style={styles.valuePill} aria-hidden="true">
        {safeValue}
        {suffix}
      </div>
    </div>
  );
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  slider: {
    flex: 1,
    minWidth: 0,
    height: 4,
    accentColor: '#22c55e',
    cursor: 'pointer',
  },
  valuePill: {
    minWidth: 42,
    height: 24,
    padding: '0 8px',
    border: '1px solid #d1d5db',
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#374151',
    background: '#ffffff',
    fontVariantNumeric: 'tabular-nums',
  },
};
