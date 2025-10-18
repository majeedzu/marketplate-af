// Vercel Blob storage helpers
import { put, del } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  console.warn('BLOB_READ_WRITE_TOKEN not set. Image uploads will fail.');
}

// Upload file to Vercel Blob
export async function uploadFile(file, pathname) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('Blob storage not configured');
  }

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });

    return blob.url;
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload file');
  }
}

// Delete file from Vercel Blob
export async function deleteFile(url) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('Blob storage not configured');
  }

  try {
    await del(url, {
      token: BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    throw new Error('Failed to delete file');
  }
}

// Generate unique filename for product images
export function generateImageFilename(originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `products/${timestamp}_${Math.random().toString(36).substring(2)}.${extension}`;
}
