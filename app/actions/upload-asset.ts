'use server';

import { createAdminClient } from '@/lib/supabase/admin';

const STORAGE_BUCKET = 'portfolio-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB for comfortable uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/gif',
];

/**
 * Server Action: Upload Asset ke Supabase Storage (portfolio-assets)
 * Menggunakan admin client sehingga upload selalu sukses tanpa terganjal auth session client.
 */
export async function uploadAssetAction(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  try {
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'portfolios';

    if (!file) {
      return { url: null, error: 'File tidak ditemukan atau belum dipilih.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        url: null,
        error: 'Format file tidak didukung. Harap gunakan gambar JPG, PNG, WebP, atau GIF.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        url: null,
        error: 'Ukuran file melebihi 5 MB. Harap kompres file gambar Anda terlebih dahulu.',
      };
    }

    const supabaseAdmin = createAdminClient();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase admin storage upload error:', error.message);
      return { url: null, error: `Gagal mengunggah ke penyimpanan: ${error.message}` };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      return { url: null, error: 'Gagal mendapatkan tautan publik gambar.' };
    }

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Error in uploadAssetAction:', err);
    return { url: null, error: err?.message || 'Terjadi kesalahan sistem saat mengunggah gambar.' };
  }
}
