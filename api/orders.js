// Orders API endpoint
import { createOrder, getOrdersByUserId } from '../lib/db.js';
import { verifyAuthFromCookie, verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get user's orders
      const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const orders = await getOrdersByUserId(decoded.userId);

      res.status(200).json({
        success: true,
        orders
      });

    } else if (req.method === 'POST') {
      // Create order
      const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { productId, sellerId, affiliateId, amount, momoNumber, reference } = req.body;

      if (!productId || !sellerId || !amount || !momoNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const order = await createOrder({
        productId,
        customerId: decoded.userId,
        sellerId,
        affiliateId: affiliateId || null,
        amount: parseFloat(amount),
        momoNumber,
        reference: reference || null
      });

      res.status(201).json({
        success: true,
        order
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Orders API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
