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

    // Get all withdrawals
    const withdrawalsSnapshot = await db.collection('withdrawals').orderBy('createdAt', 'desc').get();
    const withdrawals = [];

    for (const doc of withdrawalsSnapshot.docs) {
      const withdrawalData = doc.data();
      
      // Get user information
      const userDoc = await db.collection('users').doc(withdrawalData.userId).get();
      const userInfo = userDoc.exists ? userDoc.data() : null;

      withdrawals.push({
        id: doc.id,
        amount: withdrawalData.amount,
        momoNumber: withdrawalData.momoNumber,
        status: withdrawalData.status,
        createdAt: withdrawalData.createdAt,
        approvedAt: withdrawalData.approvedAt,
        rejectedAt: withdrawalData.rejectedAt,
        rejectionReason: withdrawalData.rejectionReason,
        user: userInfo ? {
          name: userInfo.name,
          email: userInfo.email,
          type: userInfo.type
        } : null
      });
    }

    res.status(200).json({ 
      success: true, 
      withdrawals,
      total: withdrawals.length
    });

  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
