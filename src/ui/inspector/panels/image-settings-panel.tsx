import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Component, Editor } from 'grapesjs';
import { ControlRow, SliderControl } from '../controllers';
import { AssetUrlField } from '../controls/asset-url-field';
import { BorderField } from '../controls/border-field';
import { RadiusField } from '../controls/radius-field';
import { SegmentedField } from '../controls/segmented-field';
import { TextField } from '../controls/text-field';
import { uploadImageAsset, ACCEPTED_IMAGE_TYPES } from '../../../services/assets/upload';

interface ImageSettingsPanelProps {
  component: Component;
  editor: Editor;
  attrs: Record<string, string>;
  onChange: (attrName: string, nextValue: string) => void;
  onAttrsChange: (updates: Record<string, string>) => void;
  onRefresh: () => void;
}

interface NaturalSize {
  width: number;
  height: number;
}

const FALLBACK_WIDTH = 300;
const EMAIL_MAX_WIDTH = 600;
const MIN_IMAGE_WIDTH = 40;

export function ImageSettingsPanel({
  component,
  editor,
  attrs,
  onChange,
  onAttrsChange,
  onRefresh,
}: ImageSettingsPanelProps) {
  const src = attrs.src ?? '';
  const widthAttr = attrs.width ?? '';
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parsedWidth = parsePixelWidth(widthAttr);

  useEffect(() => {
    if (!src) {
      setNaturalSize(null);
      return;
    }

    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      setNaturalSize({
        width: probe.naturalWidth,
        height: probe.naturalHeight,
      });
    };
    probe.onerror = () => {
      if (cancelled) return;
      setNaturalSize(null);
    };
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  const sliderMax = useMemo(() => {
    if (!naturalSize?.width) return EMAIL_MAX_WIDTH;
    return Math.max(MIN_IMAGE_WIDTH, Math.min(naturalSize.width, EMAIL_MAX_WIDTH));
  }, [naturalSize]);

  const visibleWidth = parsedWidth ?? naturalSize?.width ?? FALLBACK_WIDTH;
  const sliderValue = Math.min(sliderMax, Math.max(MIN_IMAGE_WIDTH, visibleWidth));
  const hasCustomWidth = parsedWidth !== null;

  const handleRemove = () => {
    const parent = component.parent();
    component.remove();
    if (parent) editor.select(parent);
    onRefresh();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const { url, mimeType } = await uploadImageAsset(file);
      // Add to asset manager so it shows up in the picker too.
      editor.AssetManager.add([{ src: url, name: file.name, type: 'image', mimeType }]);
      onChange('src', url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Check your connection and try again.');
      console.error('[image-panel] image upload failed:', err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>Image Settings</div>
      <div style={styles.fields}>
        <div style={styles.previewCard}>
          {src ? (
            <img src={src} alt={attrs.alt ?? ''} style={styles.previewImage} />
          ) : (
            <div style={styles.emptyPreview}>No image selected</div>
          )}

          <div style={styles.previewMeta}>
            {naturalSize
              ? `${naturalSize.width}px x ${naturalSize.height}px original`
              : 'Original size unknown'}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Upload button */}
        <button
          type="button"
          style={{
            ...styles.uploadButton,
            opacity: uploading ? 0.7 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
          disabled={uploading}
          onClick={handleUploadClick}
        >
          {uploading ? 'Uploading…' : '↑ Upload image'}
        </button>

        {uploadError && (
          <div style={styles.uploadError}>{uploadError}</div>
        )}

        <AssetUrlField
          editor={editor}
          label="Image URL"
          value={src}
          onChange={(value) => onChange('src', value)}
          placeholder="https://cdn.yourbrand.com/image.png"
        />

        <TextField
          label="Alt Text"
          value={attrs.alt ?? ''}
          onChange={(value) => onChange('alt', value)}
          placeholder="Describe this image"
          helpText="Shown by screen readers and when images are disabled."
        />

        <TextField
          label="Link URL"
          value={attrs.href ?? ''}
          onChange={(value) => onChange('href', value)}
          isUrl
          placeholder="https://example.com"
        />

        <SegmentedField
          label="Open Link"
          value={attrs.target ?? '_blank'}
          onChange={(value) => onChange('target', value)}
          options={[
            { label: 'New tab', value: '_blank' },
            { label: 'Same tab', value: '_self' },
          ]}
          helpText="Choose whether the image link opens in a new tab/window or the current one."
        />

        <ControlRow
          label="Width"
          helpText="Images keep their aspect ratio. Width only changes the displayed size."
        >
          <div style={styles.widthControl}>
            <SliderControl
              min={MIN_IMAGE_WIDTH}
              max={sliderMax}
              step={1}
              value={sliderValue}
              suffix="px"
              onChange={(value) => onChange('width', `${value}px`)}
              ariaLabel="Image width slider"
            />

            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                opacity: hasCustomWidth ? 1 : 0.5,
                cursor: hasCustomWidth ? 'pointer' : 'not-allowed',
              }}
              disabled={!hasCustomWidth}
              onClick={() => onChange('width', '')}
            >
              Use original size
            </button>
          </div>
        </ControlRow>

        <SegmentedField
          label="Alignment"
          value={attrs.align ?? 'center'}
          onChange={(value) => onChange('align', value)}
          options={[
            { label: 'Left', value: 'left', icon: 'left' },
            { label: 'Center', value: 'center', icon: 'center' },
            { label: 'Right', value: 'right', icon: 'right' },
          ]}
        />

        <ImagePaddingControl
          value={getImagePaddingInputSides(attrs)}
          onChange={(sides) => {
            onAttrsChange({
              padding: '',
              'padding-top': formatSpacingValue(sides.top),
              'padding-right': formatSpacingValue(sides.right),
              'padding-bottom': formatSpacingValue(sides.bottom),
              'padding-left': formatSpacingValue(sides.left),
            });
          }}
        />

        <BorderField
          label="All Sides"
          value={getAllSidesBorderValue(attrs)}
          onChange={(nextValue) => {
            const value = nextValue === 'none' ? '' : nextValue;
            onAttrsChange({
              border: '',
              'border-top': value,
              'border-right': value,
              'border-bottom': value,
              'border-left': value,
              'border-width': '',
              'border-style': '',
              'border-color': '',
            });
          }}
        />

        <BorderField
          label="Top Border"
          value={attrs['border-top'] ?? 'none'}
          onChange={(value) => onChange('border-top', value)}
        />

        <BorderField
          label="Right Border"
          value={attrs['border-right'] ?? 'none'}
          onChange={(value) => onChange('border-right', value)}
        />

        <BorderField
          label="Bottom Border"
          value={attrs['border-bottom'] ?? 'none'}
          onChange={(value) => onChange('border-bottom', value)}
        />

        <BorderField
          label="Left Border"
          value={attrs['border-left'] ?? 'none'}
          onChange={(value) => onChange('border-left', value)}
        />

        <RadiusField
          label="Rounded Corners"
          value={attrs['border-radius'] ?? '0px'}
          onChange={(value) => onChange('border-radius', value)}
        />

        <div style={styles.actions}>
          <button type="button" style={styles.dangerButton} onClick={handleRemove}>
            Remove image
          </button>
        </div>
      </div>
    </div>
  );
}

function parsePixelWidth(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if (!match) return null;

  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getAllSidesBorderValue(attrs: Record<string, string>): string {
  const sides = [
    attrs['border-top'],
    attrs['border-right'],
    attrs['border-bottom'],
    attrs['border-left'],
  ].filter((value): value is string => Boolean(value));

  if (!sides.length) return attrs.border ?? 'none';

  const [first] = sides;
  const allSidesMatch = sides.length === 4 && sides.every((value) => value === first);

  return allSidesMatch ? first : 'none';
}

interface ImagePaddingControlProps {
  value: BoxSides;
  onChange: (value: BoxSides) => void;
}

function ImagePaddingControl({ value, onChange }: ImagePaddingControlProps) {
  const [editingSide, setEditingSide] = useState<keyof BoxSides | null>(null);
  const [draftSides, setDraftSides] = useState<BoxSides>(value);

  useEffect(() => {
    setDraftSides((currentSides) => (
      editingSide
        ? { ...value, [editingSide]: currentSides[editingSide] }
        : value
    ));
  }, [editingSide, value]);

  const handleSideChange = (side: keyof BoxSides, rawValue: string) => {
    const nextDraftSides = {
      ...draftSides,
      [side]: rawValue,
    };

    setDraftSides(nextDraftSides);
    onChange(nextDraftSides);
  };

  const handleSideBlur = (side: keyof BoxSides) => {
    const nextSides = {
      ...draftSides,
      [side]: normalizeInputSide(draftSides[side]),
    };

    setEditingSide(null);
    setDraftSides(nextSides);
    onChange(nextSides);
  };

  return (
    <div style={styles.paddingControl}>
      <div style={styles.paddingHeader}>
        <span style={styles.paddingTitle}>Padding</span>
        <span style={styles.paddingHint}>Space around the image</span>
      </div>

      <div style={styles.paddingGrid}>
        <PaddingSideInput
          label="Top"
          value={draftSides.top}
          onFocus={() => setEditingSide('top')}
          onBlur={() => handleSideBlur('top')}
          onChange={(nextValue) => handleSideChange('top', nextValue)}
        />
        <PaddingSideInput
          label="Right"
          value={draftSides.right}
          onFocus={() => setEditingSide('right')}
          onBlur={() => handleSideBlur('right')}
          onChange={(nextValue) => handleSideChange('right', nextValue)}
        />
        <PaddingSideInput
          label="Bottom"
          value={draftSides.bottom}
          onFocus={() => setEditingSide('bottom')}
          onBlur={() => handleSideBlur('bottom')}
          onChange={(nextValue) => handleSideChange('bottom', nextValue)}
        />
        <PaddingSideInput
          label="Left"
          value={draftSides.left}
          onFocus={() => setEditingSide('left')}
          onBlur={() => handleSideBlur('left')}
          onChange={(nextValue) => handleSideChange('left', nextValue)}
        />
      </div>
    </div>
  );
}

interface PaddingSideInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

function PaddingSideInput({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
}: PaddingSideInputProps) {
  return (
    <label style={styles.paddingSide}>
      <span style={styles.paddingSideLabel}>{label}</span>
      <span style={styles.paddingInputWrap}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder="0"
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          style={styles.paddingInput}
          aria-label={`${label} image padding in pixels`}
        />
        <span style={styles.paddingUnit}>px</span>
      </span>
    </label>
  );
}

interface BoxSides {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

function parseBoxSides(value: string): BoxSides {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    const side = normalizeSpacingPart(parts[0]);
    return { top: side, right: side, bottom: side, left: side };
  }

  if (parts.length === 2) {
    const vertical = normalizeSpacingPart(parts[0]);
    const horizontal = normalizeSpacingPart(parts[1]);
    return {
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal,
    };
  }

  if (parts.length === 3) {
    const top = normalizeSpacingPart(parts[0]);
    const horizontal = normalizeSpacingPart(parts[1]);
    const bottom = normalizeSpacingPart(parts[2]);
    return {
      top,
      right: horizontal,
      bottom,
      left: horizontal,
    };
  }

  if (parts.length >= 4) {
    return {
      top: normalizeSpacingPart(parts[0]),
      right: normalizeSpacingPart(parts[1]),
      bottom: normalizeSpacingPart(parts[2]),
      left: normalizeSpacingPart(parts[3]),
    };
  }

  return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
}

function parseBoxSidesForInput(value: string): BoxSides {
  const sides = parseBoxSides(value);
  return {
    top: stripUnitForInput(sides.top),
    right: stripUnitForInput(sides.right),
    bottom: stripUnitForInput(sides.bottom),
    left: stripUnitForInput(sides.left),
  };
}

function getImagePaddingInputSides(attrs: Record<string, string>): BoxSides {
  const hasIndividualPadding = (
    attrs['padding-top'] !== undefined
    || attrs['padding-right'] !== undefined
    || attrs['padding-bottom'] !== undefined
    || attrs['padding-left'] !== undefined
  );
  const shorthandSides = parseBoxSidesForInput(attrs.padding ?? '0px');

  if (!hasIndividualPadding) return shorthandSides;

  return {
    top: stripUnitForInput(attrs['padding-top'] ?? shorthandSides.top),
    right: stripUnitForInput(attrs['padding-right'] ?? shorthandSides.right),
    bottom: stripUnitForInput(attrs['padding-bottom'] ?? shorthandSides.bottom),
    left: stripUnitForInput(attrs['padding-left'] ?? shorthandSides.left),
  };
}

function normalizeSpacingPart(value: string | undefined): string {
  if (!value) return '0px';
  return formatSpacingValue(value);
}

function stripUnitForInput(value: string): string {
  return value.replace(/px$/i, '').trim();
}

function normalizeInputSide(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '0px') return '0';
  return trimmed.replace(/px$/i, '');
}

function formatSpacingValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '0') return '0px';
  if (/^-?\d*\.?\d+(px|%|em|rem)$/i.test(trimmed)) return trimmed;
  if (/^-?\d*\.?\d+$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    borderBottom: '1px solid #f3f4f6',
  },
  panelTitle: {
    padding: '10px 16px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6b7280',
  },
  fields: {
    padding: '4px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  previewCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#f9fafb',
    padding: 10,
  },
  previewImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 140,
    objectFit: 'contain',
    margin: '0 auto',
    borderRadius: 6,
  },
  emptyPreview: {
    display: 'grid',
    placeItems: 'center',
    minHeight: 104,
    color: '#9ca3af',
    fontSize: 12,
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    background: '#ffffff',
  },
  previewMeta: {
    marginTop: 8,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  widthControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  paddingControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    background: '#f9fafb',
  },
  paddingHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  paddingTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  paddingHint: {
    fontSize: 10,
    color: '#9ca3af',
  },
  paddingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(74px, 1fr))',
    gap: 8,
    width: '100%',
  },
  paddingSide: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  paddingSideLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#6b7280',
  },
  paddingInputWrap: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: 26,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    background: '#ffffff',
    overflow: 'hidden',
  },
  paddingInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: '0 6px',
    border: 'none',
    outline: 'none',
    fontSize: 12,
    color: '#111827',
    background: 'transparent',
  },
  paddingUnit: {
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    padding: '0 6px',
    borderLeft: '1px solid #e5e7eb',
    background: '#f9fafb',
    fontSize: 10,
    color: '#9ca3af',
  },
  secondaryButton: {
    height: 26,
    border: '1px solid #d1d5db',
    borderRadius: 5,
    background: '#ffffff',
    color: '#4b5563',
    fontSize: 11,
    fontWeight: 600,
  },
  actions: {
    paddingTop: 2,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  dangerButton: {
    height: 28,
    border: '1px solid #fecaca',
    borderRadius: 5,
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 10px',
  },
};
