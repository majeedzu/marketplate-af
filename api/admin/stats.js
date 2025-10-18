// Admin platform stats endpoint
import { getPlatformStats } from '../../lib/db.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin access
    await requireAdmin(req);

    // Get platform statistics
    const stats = await getPlatformStats();

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
