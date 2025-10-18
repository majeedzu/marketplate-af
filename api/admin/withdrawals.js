// Admin withdrawals endpoint
import { getAllWithdrawals, updateWithdrawal } from '../../lib/db.js';
import { requireAdmin } from '../../lib/auth.js';

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
    // Check admin access
    const decoded = await requireAdmin(req);

    if (req.method === 'GET') {
      // Get all withdrawals
      const withdrawals = await getAllWithdrawals();

      res.status(200).json({
        success: true,
        withdrawals,
        total: withdrawals.length
      });

    } else if (req.method === 'POST') {
      const { action, withdrawalId, reason } = req.body;

      if (!action || !withdrawalId) {
        return res.status(400).json({ error: 'Action and withdrawal ID are required' });
      }

      if (action === 'approve') {
        await updateWithdrawal(withdrawalId, {
          status: 'approved',
          approved_at: new Date(),
          approved_by: decoded.userId
        });

        res.status(200).json({
          success: true,
          message: 'Withdrawal approved successfully'
        });

      } else if (action === 'reject') {
        if (!reason) {
          return res.status(400).json({ error: 'Rejection reason is required' });
        }

        await updateWithdrawal(withdrawalId, {
          status: 'rejected',
          rejected_at: new Date(),
          rejected_by: decoded.userId,
          rejection_reason: reason
        });

        res.status(200).json({
          success: true,
          message: 'Withdrawal rejected successfully'
        });

      } else {
        res.status(400).json({ error: 'Invalid action' });
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
