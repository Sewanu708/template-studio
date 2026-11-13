import type { Plugin } from 'grapesjs';
import { uploadImageAsset, ACCEPTED_IMAGE_TYPES } from '../../services/assets/upload';

interface AssetManagerUploadConfig {
  upload?: string | boolean | false;
  uploadFile?: (event: Event) => Promise<void>;
  noAssets?: string;
  acceptMimeTypes?: string;
}

/**
 * Wires hosted image uploads into the GrapesJS asset manager.
 *
 * GrapesJS calls `assetManager.uploadFile(e)` with the native input/drop
 * event when the user picks or drops files. This plugin uploads each file
 * through the shared asset upload service and adds the hosted URL back as
 * an asset so it appears in the picker.
 */
export const assetUploadPlugin: Plugin = (editor) => {
  editor.onReady(() => {
    const am = editor.AssetManager;
    const config = am.getConfig() as AssetManagerUploadConfig;

    // Allow file input to appear in the asset manager UI.
    config.upload = true;
    config.noAssets = 'No images yet. Upload one or paste a URL.';
    config.acceptMimeTypes = ACCEPTED_IMAGE_TYPES;

    // Override the upload handler. GrapesJS calls this with the raw
    // input change or drop event whenever the user selects files.
    config.uploadFile = async (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const dataTransfer = (e as DragEvent).dataTransfer;
      const rawFiles = dataTransfer?.files ?? target?.files;
      if (!rawFiles?.length) return;

      const files = Array.from(rawFiles);

      await Promise.all(
        files.map(async (file) => {
          try {
            const { url, fileName, mimeType } = await uploadImageAsset(file);
            am.add([{ src: url, name: fileName, type: 'image', mimeType }]);
          } catch (err) {
            console.error('[asset-upload] image upload failed:', (err as Error).message);
          }
        }),
      );
    };
  });
};
