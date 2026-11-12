const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

export interface UploadResult {
  url: string;
  fileName: string;
  publicId?: string;
  width?: number;
  height?: number;
}

/**
 * Uploads an image from the browser to Cloudinary using an unsigned upload
 * preset and returns the hosted HTTPS URL.
 *
 * This intentionally avoids AWS/S3 secrets in the frontend. Cloudinary unsigned
 * presets are suitable for this testing/staging flow where compiled MJML needs
 * publicly reachable image URLs for real email sends.
 */
export async function uploadImageAsset(file: File): Promise<UploadResult> {
  validateImageFile(file);

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null) as CloudinaryUploadResponse | null;

  if (!response.ok || !data?.secure_url) {
    const message = data?.error?.message ?? 'Cloudinary upload failed.';
    throw new Error(message);
  }

  return {
    url: data.secure_url,
    fileName: file.name,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

/** Accepted MIME types for the file picker. */
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';

const ACCEPTED_IMAGE_TYPE_SET = new Set(ACCEPTED_IMAGE_TYPES.split(','));

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  error?: {
    message?: string;
  };
}

function validateImageFile(file: File): void {
  if (!ACCEPTED_IMAGE_TYPE_SET.has(file.type)) {
    throw new Error('Unsupported image type. Use JPG, PNG, GIF, WebP, or SVG.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image is too large. Please upload an image under 10MB.');
  }
}
