import React from 'react';
import { ControlRow, SliderControl } from '../controllers';

interface UnitFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  units?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
}

export function UnitField({
  label,
  value,
  onChange,
  units = ['px'],
  min,
  max,
  step = 1,
  placeholder,
  helpText,
}: UnitFieldProps) {
  // Parse numeric amount and unit suffix
  const parsed = parseUnitValue(value, units);
  const currentNum = parsed.num;
  const currentUnit = parsed.unit;

  const handleNumChange = (newNumStr: string) => {
    if (newNumStr === '') {
      onChange('');
      return;
    }
    const num = Number(newNumStr);
    if (!Number.isNaN(num)) {
      onChange(`${num}${currentUnit}`);
    } else {
      onChange(newNumStr);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    if (currentNum === '') return;
    onChange(`${currentNum}${newUnit}`);
  };

  const showSlider = min !== undefined && max !== undefined && currentNum !== '';

  return (
    <div style={styles.container}>
      <ControlRow label={label} helpText={helpText}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={currentNum !== '' ? currentNum : value}
            placeholder={placeholder ?? 'auto'}
            onChange={(e) => handleNumChange(e.target.value)}
            style={styles.numInput}
            aria-label={`${label} amount`}
          />

          {units.length > 1 ? (
            <select
              value={currentUnit}
              onChange={(e) => handleUnitChange(e.target.value)}
              style={styles.unitSelect}
              aria-label={`${label} unit`}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u || '—'}
                </option>
              ))}
            </select>
          ) : units.length === 1 && units[0] ? (
            <span style={styles.singleUnit}>{units[0]}</span>
          ) : null}
        </div>
      </ControlRow>

      {showSlider && (
        <div style={styles.sliderRow}>
          <SliderControl
            min={min}
            max={max}
            step={step}
            value={Number(currentNum) || min}
            suffix={currentUnit}
            onChange={(nextValue) => onChange(`${nextValue}${currentUnit}`)}
            ariaLabel={`${label} slider`}
          />
        </div>
      )}
    </div>
  );
}

function parseUnitValue(val: string, allowedUnits: string[]): { num: string; unit: string } {
  if (!val || val === 'auto') return { num: '', unit: allowedUnits[0] ?? 'px' };

  for (const u of allowedUnits) {
    if (u && val.endsWith(u)) {
      const numPart = val.slice(0, -u.length).trim();
      return { num: numPart, unit: u };
    }
  }

  const match = val.match(/^(-?\d*\.?\d+)(.*)$/);
  if (match) {
    return { num: match[1], unit: match[2] || (allowedUnits[0] ?? 'px') };
  }

  return { num: val, unit: allowedUnits[0] ?? 'px' };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    overflow: 'hidden',
    background: '#ffffff',
    height: 28,
    width: '100%',
  },
  numInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: '0 8px',
    border: 'none',
    fontSize: 12,
    color: '#111827',
    outline: 'none',
    background: 'transparent',
  },
  unitSelect: {
    border: 'none',
    borderLeft: '1px solid #e5e7eb',
    background: '#f9fafb',
    fontSize: 11,
    color: '#6b7280',
    padding: '0 4px',
    height: '100%',
    cursor: 'pointer',
    outline: 'none',
  },
  singleUnit: {
    padding: '0 8px',
    fontSize: 11,
    color: '#9ca3af',
    background: '#f9fafb',
    borderLeft: '1px solid #e5e7eb',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
  },
  sliderRow: {
    paddingLeft: 108,
  },
};
