import type { Component } from 'grapesjs';

export const SECTION_COLUMN_GAP_FIELD = '__column-gap';

interface SpacingSides {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export function getSectionColumnGapValue(section: Component): string {
  const columns = getDirectColumns(section);
  if (columns.length < 2) return '0px';

  const firstColumnSides = getColumnPaddingSides(columns[0]);
  const secondColumnSides = getColumnPaddingSides(columns[1]);
  const gap = parsePx(firstColumnSides.right) + parsePx(secondColumnSides.left);

  return `${formatPx(gap)}px`;
}

export function applySectionColumnGap(section: Component, nextGap: string): void {
  const columns = getDirectColumns(section);
  if (!columns.length) return;

  const gap = Math.max(0, parsePx(nextGap));
  const halfGap = gap / 2;

  columns.forEach((column, index) => {
    const currentSides = getColumnPaddingSides(column);
    const isFirst = index === 0;
    const isLast = index === columns.length - 1;

    column.removeAttributes('padding');
    column.addAttributes({
      'padding-top': currentSides.top,
      'padding-right': isLast ? '0px' : `${formatPx(halfGap)}px`,
      'padding-bottom': currentSides.bottom,
      'padding-left': isFirst ? '0px' : `${formatPx(halfGap)}px`,
    });
  });

  section.view?.render();
}

function getDirectColumns(section: Component): Component[] {
  return section.components().filter((child: Component) => child.is('mj-column'));
}

function getColumnPaddingSides(column: Component): SpacingSides {
  const attrs = column.getAttributes() as Record<string, string>;
  const shorthandSides = parseSpacingSides(attrs.padding || '0px');

  return {
    top: formatSpacingPart(attrs['padding-top'] ?? shorthandSides.top),
    right: formatSpacingPart(attrs['padding-right'] ?? shorthandSides.right),
    bottom: formatSpacingPart(attrs['padding-bottom'] ?? shorthandSides.bottom),
    left: formatSpacingPart(attrs['padding-left'] ?? shorthandSides.left),
  };
}

function parseSpacingSides(value: string): SpacingSides {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    const side = formatSpacingPart(parts[0]);
    return { top: side, right: side, bottom: side, left: side };
  }

  if (parts.length === 2) {
    const vertical = formatSpacingPart(parts[0]);
    const horizontal = formatSpacingPart(parts[1]);
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
  }

  if (parts.length === 3) {
    const top = formatSpacingPart(parts[0]);
    const horizontal = formatSpacingPart(parts[1]);
    const bottom = formatSpacingPart(parts[2]);
    return { top, right: horizontal, bottom, left: horizontal };
  }

  if (parts.length >= 4) {
    return {
      top: formatSpacingPart(parts[0]),
      right: formatSpacingPart(parts[1]),
      bottom: formatSpacingPart(parts[2]),
      left: formatSpacingPart(parts[3]),
    };
  }

  return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
}

function formatSpacingPart(value: string | undefined): string {
  const trimmed = String(value ?? '').trim();

  if (!trimmed || trimmed === '0') return '0px';
  if (/^-?\d*\.?\d+(px|%|em|rem)$/i.test(trimmed)) return trimmed;
  if (/^-?\d*\.?\d+$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

function parsePx(value: string): number {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPx(value: number): string {
  return Number(value.toFixed(2)).toString();
}
