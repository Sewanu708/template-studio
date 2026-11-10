import { useState } from 'react';
import { BlocksProvider } from '@grapesjs/react';
import type { Block } from 'grapesjs';

/**
 * Block panel — uses @grapesjs/react BlocksProvider which gives us the
 * correct dragStart/dragStop handlers that integrate with GrapesJS DnD.
 * The editor prop is no longer needed; context is consumed via BlocksProvider.
 */
export function BlockPanel() {
  const [search, setSearch] = useState('');

  return (
    <BlocksProvider>
      {({ blocks, dragStart, dragStop, mapCategoryBlocks }) => {
        const term = search.toLowerCase();

        const filtered = new Map<string, Block[]>();
        mapCategoryBlocks.forEach((categoryBlocks, category) => {
          const matches = categoryBlocks.filter(
            (b) =>
              term === '' ||
              b.getLabel().toLowerCase().includes(term) ||
              category.toLowerCase().includes(term) ||
              b.getId().toLowerCase().includes(term),
          );
          if (matches.length) filtered.set(category, matches);
        });

        const totalMatches = [...filtered.values()].reduce((n, arr) => n + arr.length, 0);

        return (
          <div style={styles.panel}>
            <input
              style={styles.search}
              placeholder="Search blocks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search blocks"
            />
            <div style={styles.list}>
              {totalMatches === 0 && (
                <p style={styles.empty}>
                  {blocks.length === 0
                    ? 'No blocks registered.'
                    : `No blocks match "${search}"`}
                </p>
              )}
              {[...filtered.entries()].map(([category, items]) => (
                <div key={category}>
                  <p style={styles.category}>{category}</p>
                  <div style={styles.grid}>
                    {items.map((block) => (
                      <button
                        key={block.getId()}
                        style={styles.block}
                        draggable
                        onDragStart={(event) => dragStart(block, event.nativeEvent)}
                        onDragEnd={() => dragStop(false)}
                        title={block.getLabel()}
                        aria-label={`Add ${block.getLabel()} block`}
                      >
                        {block.getMedia() ? (
                          <span
                            style={styles.blockIcon}
                            dangerouslySetInnerHTML={{ __html: block.getMedia()! }}
                          />
                        ) : (
                          <span style={styles.blockIconFallback}>☰</span>
                        )}
                        <span style={styles.blockLabel}>{block.getLabel()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </BlocksProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  search: {
    margin: '8px',
    padding: '6px 10px',
    fontSize: 13,
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    outline: 'none',
    flexShrink: 0,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px 8px',
  },
  category: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#9ca3af',
    margin: '12px 0 6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '10px 6px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'grab',
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  blockIcon: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    color: '#6b7280',
  },
  blockIconFallback: {
    fontSize: 20,
    color: '#6b7280',
  },
  blockLabel: {
    fontSize: 11,
    color: '#374151',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 24,
  },
};
