import { ControlRow, SliderControl } from '../controllers';

interface SliderFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  helpText?: string;
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  helpText,
}: SliderFieldProps) {
  const currentValue = parseSliderValue(value, suffix, min);

  return (
    <ControlRow label={label} helpText={helpText}>
      <SliderControl
        min={min}
        max={max}
        step={step}
        value={currentValue}
        suffix={suffix}
        onChange={(nextValue) => onChange(`${nextValue}${suffix}`)}
        ariaLabel={`${label} slider`}
      />
    </ControlRow>
  );
}

function parseSliderValue(value: string, suffix: string, fallback: number): number {
  if (!value) return fallback;

  const numericPart = suffix && value.endsWith(suffix)
    ? value.slice(0, -suffix.length)
    : value;

  const parsed = Number.parseFloat(numericPart);
  return Number.isFinite(parsed) ? parsed : fallback;
}
