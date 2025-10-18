// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCtNyYhm6x2ComUYYuUxmXFk6-tfR-mWBs",
    authDomain: "affiliate-web-4f4c9.firebaseapp.com",
    projectId: "affiliate-web-4f4c9",
    storageBucket: "affiliate-web-4f4c9.appspot.com",
    messagingSenderId: "643647499559",
    appId: "1:643647499559:web:a4c9fd8724076834224d02",
    measurementId: "G-PCQZ0LD1Z3"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage(app);

// Make Firebase services globally available
window.firebase = {
    auth,
    db,
    storage,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    updateDoc,
    increment
};

// Paystack configuration
window.PAYSTACK_PUBLIC_KEY = 'pk_test_95817b9d9c16e887607fd34c48a40eb7f590b9f2'; // Replace with your Paystack public key

// Global variables
window.currentUser = null;
window.userType = null;

// Auth state listener
onAuthStateChanged(auth, async (user) => {
    window.currentUser = user;
    if (user) {
        // Get user data from Firestore
        try {
            const docSnap = await getDoc(doc(db, 'users', user.uid));
            if (docSnap.exists()) {
                const userData = docSnap.data();
                window.userType = userData.type;
                updateUIForUser(userData);
                
                // Update email verification status if verified
                if (user.emailVerified && !userData.emailVerified) {
                    await updateDoc(doc(db, 'users', user.uid), {
                        emailVerified: true
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        window.userType = null;
        updateUIForGuest();
    }
});

function updateUIForUser(userData) {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    
    if (navAuth && navUser && userName) {
        navAuth.style.display = 'none';
        navUser.style.display = 'block';
        userName.textContent = userData.name || 'User';
    }
    
    // Show admin navigation if user is admin
    if (window.showAdminNavigation) {
        window.showAdminNavigation();
    }
}

function updateUIForGuest() {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    
    if (navAuth && navUser) {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
    }
}

console.log('Firebase initialized successfully with Storage support');