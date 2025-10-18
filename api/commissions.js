// Commissions API endpoint
import { getCommissionsByUserId } from '../lib/db.js';
import { verifyAuthFromCookie, verifyAuth } from '../lib/auth.js';

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
    // Get user's commissions
    const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const commissions = await getCommissionsByUserId(decoded.userId);

    res.status(200).json({
      success: true,
      commissions
    });

  } catch (error) {
    console.error('Commissions API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
