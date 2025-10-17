const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token and check admin status
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const isAdmin = userData.type === 'admin' || userData.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get platform statistics
    const [usersSnapshot, productsSnapshot, ordersSnapshot, withdrawalsSnapshot, commissionsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('withdrawals').get(),
      db.collection('commissions').get()
    ]);

    // Calculate user statistics
    const users = [];
    let totalRevenue = 0;
    let totalCommissions = 0;
    let totalWithdrawals = 0;

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push(userData);
    });

    const userStats = {
      total: users.length,
      customers: users.filter(u => u.type === 'customer').length,
      sellers: users.filter(u => u.type === 'seller').length,
      affiliates: users.filter(u => u.type === 'affiliate').length,
      admins: users.filter(u => u.type === 'admin').length
    };

    // Calculate product statistics
    const products = [];
    productsSnapshot.forEach(doc => {
      const productData = doc.data();
      products.push(productData);
    });

    const activeProducts = products.filter(p => p.status === 'active').length;

    // Calculate order statistics
    const orders = [];
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      orders.push(orderData);
      if (orderData.status === 'completed') {
        totalRevenue += orderData.amount || 0;
      }
    });

    const orderStats = {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status === 'pending').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Calculate withdrawal statistics
    const withdrawals = [];
    withdrawalsSnapshot.forEach(doc => {
      const withdrawalData = doc.data();
      withdrawals.push(withdrawalData);
      if (withdrawalData.status === 'approved') {
        totalWithdrawals += withdrawalData.amount || 0;
      }
    });

    const withdrawalStats = {
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'pending').length,
      approved: withdrawals.filter(w => w.status === 'approved').length,
      rejected: withdrawals.filter(w => w.status === 'rejected').length
    };

    // Calculate commission statistics
    const commissions = [];
    commissionsSnapshot.forEach(doc => {
      const commissionData = doc.data();
      commissions.push(commissionData);
      if (commissionData.status === 'completed') {
        totalCommissions += commissionData.amount || 0;
      }
    });

    const commissionStats = {
      total: commissions.length,
      completed: commissions.filter(c => c.status === 'completed').length,
      pending: commissions.filter(c => c.status === 'pending').length
    };

    // Calculate monthly growth (simplified)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const recentOrders = orders.filter(o => o.createdAt && o.createdAt.toDate() >= lastMonth);
    const recentUsers = users.filter(u => u.createdAt && u.createdAt.toDate() >= lastMonth);

    const stats = {
      revenue: {
        total: totalRevenue,
        monthly: recentOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
      },
      users: userStats,
      products: {
        total: products.length,
        active: activeProducts
      },
      orders: orderStats,
      withdrawals: {
        ...withdrawalStats,
        totalAmount: totalWithdrawals
      },
      commissions: {
        ...commissionStats,
        totalAmount: totalCommissions
      },
      growth: {
        newUsers: recentUsers.length,
        newOrders: recentOrders.length
      }
    };

    res.status(200).json({ 
      success: true, 
      stats
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
