// Admin configuration and initialization
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Admin credentials (user should change password after first login)
const ADMIN_EMAIL = 'admin@marketplate.com';
const ADMIN_PASSWORD = 'AdminMarketplace2024!';

// Initialize admin user if it doesn't exist
async function initializeAdmin() {
    if (!window.firebase || !window.firebase.auth) {
        console.log('Firebase not ready, retrying admin initialization...');
        setTimeout(initializeAdmin, 1000);
        return;
    }

    try {
        // Check if admin user already exists
        const adminDoc = await window.firebase.getDoc(
            window.firebase.doc(window.firebase.db, 'users', 'admin')
        );

        if (!adminDoc.exists()) {
            console.log('Creating admin user...');
            
            // Create admin user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                window.firebase.auth, 
                ADMIN_EMAIL, 
                ADMIN_PASSWORD
            );
            
            const adminUser = userCredential.user;
            
            // Create admin document in Firestore
            await window.firebase.setDoc(
                window.firebase.doc(window.firebase.db, 'users', adminUser.uid),
                {
                    name: 'MarketPlate Admin',
                    email: ADMIN_EMAIL,
                    type: 'admin',
                    createdAt: new Date(),
                    balance: 0,
                    totalEarnings: 0,
                    totalSales: 0,
                    emailVerified: true,
                    isAdmin: true
                }
            );

            // Also create a reference document for admin lookup
            await window.firebase.setDoc(
                window.firebase.doc(window.firebase.db, 'admin', 'config'),
                {
                    adminUid: adminUser.uid,
                    adminEmail: ADMIN_EMAIL,
                    createdAt: new Date(),
                    initialized: true
                }
            );

            console.log('Admin user created successfully!');
            console.log('Admin Email:', ADMIN_EMAIL);
            console.log('Admin Password:', ADMIN_PASSWORD);
            console.log('Please change the password after first login!');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('Admin user already exists in Firebase Auth');
        } else {
            console.error('Error initializing admin:', error);
        }
    }
}

// Check if current user is admin
async function isCurrentUserAdmin() {
    if (!window.currentUser) return false;
    
    try {
        const userDoc = await window.firebase.getDoc(
            window.firebase.doc(window.firebase.db, 'users', window.currentUser.uid)
        );
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.type === 'admin' || userData.isAdmin === true;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
    
    return false;
}

// Show admin navigation if user is admin
async function showAdminNavigation() {
    const isAdmin = await isCurrentUserAdmin();
    const adminNav = document.getElementById('adminNav');
    
    if (adminNav) {
        adminNav.style.display = isAdmin ? 'block' : 'none';
    }
}

// Make functions globally available
window.initializeAdmin = initializeAdmin;
window.isCurrentUserAdmin = isCurrentUserAdmin;
window.showAdminNavigation = showAdminNavigation;

// Admin auto-initialization disabled for security in production.
// Create an admin user via the app then promote in Firestore (users/{uid}).

console.log('Admin configuration loaded');
