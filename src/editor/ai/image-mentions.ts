import type { Editor } from 'grapesjs';
import type { MentionedAsset } from './agent-types';

/**
 * Retrieves all image assets registered in GrapesJS AssetManager.
 */
export function getAvailableAssets(editor: Editor): MentionedAsset[] {
  try {
    const am = editor.AssetManager;
    const all = am.getAll();
    const models = (all as unknown as { models?: unknown[] }).models ?? (Array.isArray(all) ? all : []);

    return models
      .map((item: unknown, idx: number) => {
        const obj = item as Record<string, unknown>;
        const getFn = typeof obj.get === 'function' ? (key: string) => (obj.get as (k: string) => unknown)(key) : (key: string) => obj[key];

        const src = String(getFn('src') ?? (typeof obj.getSrc === 'function' ? (obj.getSrc as () => unknown)() : '') ?? '').trim();
        const name = String(getFn('name') ?? '').trim();
        const id = String(getFn('id') ?? obj.cid ?? `asset-${idx}`);

        const fallbackName = src.split('/').pop()?.split('?')[0] || `Image ${idx + 1}`;

        return {
          id,
          name: name || fallbackName,
          url: src,
        };
      })
      .filter((asset: MentionedAsset) => Boolean(asset.url));
  } catch (err) {
    console.warn('[image-mentions] Failed to read assets from AssetManager:', err);
    return [];
  }
}

export interface MentionMatch {
  query: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Checks if the cursor is currently in an '@query' mention context.
 */
export function detectMentionQuery(
  text: string,
  cursorPos: number,
): MentionMatch | null {
  const textBefore = text.slice(0, cursorPos);
  const atIndex = textBefore.lastIndexOf('@');

  if (atIndex === -1) return null;

  // Ensure @ is at start of string or preceded by whitespace
  if (atIndex > 0 && !/\s/.test(textBefore[atIndex - 1])) {
    return null;
  }

  const query = textBefore.slice(atIndex + 1);

  // If there's newline or space after @, mention mode is deactivated
  if (/[\r\n]/.test(query)) {
    return null;
  }

  return {
    query,
    startIndex: atIndex,
    endIndex: cursorPos,
  };
}

/**
 * Replaces the '@query' segment with the chosen asset mention tag.
 */
export function insertMentionIntoText(
  text: string,
  match: MentionMatch,
  asset: MentionedAsset,
): { nextText: string; nextCursorPos: number } {
  const mentionTag = `@${asset.name} `;
  const before = text.slice(0, match.startIndex);
  const after = text.slice(match.endIndex);
  const nextText = `${before}${mentionTag}${after}`;
  const nextCursorPos = match.startIndex + mentionTag.length;

  return {
    nextText,
    nextCursorPos,
  };
}
