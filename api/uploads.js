// Image upload endpoint using Vercel Blob
import { uploadFile, generateImageFilename } from '../lib/blob.js';
import { verifyAuthFromCookie, verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    let decoded = verifyAuthFromCookie(req);
    if (!decoded) {
      decoded = verifyAuth(req);
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    // Generate unique filename
    const filename = generateImageFilename(file.name);

    // Upload to Vercel Blob
    const imageUrl = await uploadFile(file, filename);

    res.status(200).json({
      success: true,
      imageUrl,
      filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
