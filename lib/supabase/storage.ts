import { createClient } from './client';

export const STORAGE_BUCKET = 'portfolio-assets';
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Ukuran file melebihi 2 MB. Harap kompres gambar Anda.' };
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
    const supabase = createClient();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      return { url: null, error: `Gagal upload ke Storage: ${error.message}` };
    }

    if (!data?.path) {
      return { url: null, error: 'Upload berhasil tetapi path file tidak ditemukan.' };
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      return { url: null, error: 'Gagal mendapatkan Public URL dari bucket storage.' };
    }

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Terjadi kesalahan sistem saat upload file.' };
  }
}
