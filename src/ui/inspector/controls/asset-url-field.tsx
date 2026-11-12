import type { Asset, Editor } from 'grapesjs';
import { TextField } from './text-field';

interface AssetUrlFieldProps {
  editor: Editor;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
}

export function AssetUrlField({
  editor,
  label,
  value,
  onChange,
  placeholder,
  helpText,
}: AssetUrlFieldProps) {
  const openAssetManager = () => {
    const assetManager = editor.AssetManager;

    assetManager.open({
      types: ['image'],
      accept: 'image/*',
      select(asset: Asset, complete: boolean) {
        const src = String(asset.getSrc?.() ?? asset.get('src') ?? '');
        if (!src) return;

        onChange(src);
        if (complete) assetManager.close();
      },
    });
  };

  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      isUrl
      placeholder={placeholder}
      helpText={helpText}
      onClear={() => onChange('')}
      actionLabel="Choose"
      actionTitle="Choose image from assets"
      onAction={openAssetManager}
    />
  );
}
