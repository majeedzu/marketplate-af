// Withdrawals API endpoint
import { createWithdrawal, getWithdrawalsByUserId } from '../lib/db.js';
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
      // Get user's withdrawals
      const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const withdrawals = await getWithdrawalsByUserId(decoded.userId);

      res.status(200).json({
        success: true,
        withdrawals
      });

    } else if (req.method === 'POST') {
      // Create withdrawal
      const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { amount, momoNumber } = req.body;

      if (!amount || !momoNumber) {
        return res.status(400).json({ error: 'Amount and MoMo number are required' });
      }

      if (parseFloat(amount) < 10) {
        return res.status(400).json({ error: 'Minimum withdrawal amount is ₵10' });
      }

      const withdrawal = await createWithdrawal({
        userId: decoded.userId,
        amount: parseFloat(amount),
        momoNumber
      });

      res.status(201).json({
        success: true,
        withdrawal
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Withdrawals API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
