import { uploadAssetAction } from '@/app/actions/upload-asset';

export const STORAGE_BUCKET = 'portfolio-assets';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Ukuran file melebihi 5 MB. Harap kompres gambar Anda.' };
  }
  return { valid: true };
}

export async function uploadAsset(
  file: File,
  folder: string = 'avatars'
): Promise<{ url: string | null; error: string | null }> {
  // Client-side file validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { url: null, error: validation.error || 'File tidak valid' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const result = await uploadAssetAction(formData);
    return result;
  } catch (err: any) {
    return { url: null, error: err?.message || 'Terjadi kesalahan sistem saat upload file.' };
  }
}
