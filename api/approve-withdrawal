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
    const { idToken, withdrawalId } = req.body;

    if (!idToken || !withdrawalId) {
      return res.status(400).json({ error: 'ID token and withdrawal ID are required' });
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

    // Get withdrawal document
    const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
    
    if (!withdrawalDoc.exists) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawalData = withdrawalDoc.data();

    if (withdrawalData.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }

    // Update withdrawal status to approved
    await db.collection('withdrawals').doc(withdrawalId).update({
      status: 'approved',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: uid
    });

    res.status(200).json({ 
      success: true, 
      message: 'Withdrawal approved successfully'
    });

  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
