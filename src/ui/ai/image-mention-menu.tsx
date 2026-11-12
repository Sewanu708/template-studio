import React, { useEffect, useState } from 'react';
import type { MentionedAsset } from '../../editor/ai/agent-types';

interface ImageMentionMenuProps {
  assets: MentionedAsset[];
  query: string;
  onSelect: (asset: MentionedAsset) => void;
  onClose: () => void;
}

export const ImageMentionMenu: React.FC<ImageMentionMenuProps> = ({
  assets,
  query,
  onSelect,
  onClose,
}) => {
  const filtered = assets.filter((asset) =>
    asset.name.toLowerCase().includes(query.toLowerCase()),
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        if (filtered[selectedIndex]) {
          e.preventDefault();
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  return (
    <div style={styles.menuContainer}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Mention Image Asset</span>
        <span style={styles.headerCount}>
          {filtered.length} {filtered.length === 1 ? 'image' : 'images'}
        </span>
      </div>

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            {assets.length === 0
              ? 'No images in Asset Manager yet.'
              : `No images matching "@${query}"`}
          </div>
        ) : (
          filtered.map((asset, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={asset.id}
                style={{
                  ...styles.item,
                  backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => onSelect(asset)}
              >
                <div style={styles.thumbWrapper}>
                  <img
                    src={asset.url}
                    alt={asset.name}
                    style={styles.thumbnail}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div style={styles.infoWrapper}>
                  <div style={styles.assetName}>{asset.name}</div>
                  <div style={styles.assetUrl}>{asset.url}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  menuContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    zIndex: 1050,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 220,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 600,
  },
  headerTitle: {
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  headerCount: {
    fontWeight: 400,
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  },
  thumbWrapper: {
    width: 32,
    height: 32,
    borderRadius: 4,
    overflow: 'hidden',
    background: '#f3f4f6',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  infoWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  assetName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  assetUrl: {
    fontSize: 11,
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyState: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
  },
};
