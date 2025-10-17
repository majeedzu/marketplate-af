// Import Firebase functions
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Global variables
let currentSection = 'home';
let currentDashboardTab = 'overview';
let products = [];
let orders = [];
let commissions = [];
let selectedImageFile = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    showSection('home');
    
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }
}

function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
        });
    });
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Add product form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    // Image upload preview
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', handleImageSelect);
    }
    
    // Withdrawal form
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', handleWithdrawal);
    }
}

async function loadInitialData() {
    showLoading(true);
    
    try {
        await loadProducts();
        await loadStats();
        
        if (window.currentUser) {
            await loadDashboardData();
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error loading data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// Image handling
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }
    
    selectedImageFile = file;
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Product preview">`;
    };
    reader.readAsDataURL(file);
}

async function uploadImage(file) {
    if (!file) throw new Error('No file selected');
    
    const timestamp = Date.now();
    const fileName = `products/${timestamp}_${file.name}`;
    const storageRef = ref(window.firebase.storage, fileName);
    
    showToast('Uploading image...', 'info');
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(window.firebase.auth, email, password);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
            showToast('Please verify your email before logging in. Check your inbox.', 'warning');
            await signOut(window.firebase.auth);
            showLoading(false);
            return;
        }
        
        showToast('Login successful!', 'success');
        closeModal('loginModal');
        showSection('dashboard');
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const type = document.getElementById('registerType').value;
    
    if (!name || !email || !password || !confirmPassword || !type) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(window.firebase.auth, email, password);
        const user = userCredential.user;
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Create user document in Firestore
        await window.firebase.setDoc(window.firebase.doc(window.firebase.db, 'users', user.uid), {
            name: name,
            email: email,
            type: type,
            createdAt: new Date(),
            balance: 0,
            totalEarnings: 0,
            totalSales: 0,
            emailVerified: false
        });
        
        showToast('Registration successful! Please check your email to verify your account.', 'success');
        closeModal('registerModal');
        document.getElementById('registerForm').reset();
        
        // Sign out user until they verify email
        await signOut(window.firebase.auth);
        
    } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotPasswordEmail').value;
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await sendPasswordResetEmail(window.firebase.auth, email);
        showToast('Password reset email sent! Check your inbox.', 'success');
        closeModal('forgotPasswordModal');
        document.getElementById('forgotPasswordForm').reset();
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send reset email. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function logout() {
    try {
        await signOut(window.firebase.auth);
        showToast('Logged out successfully', 'success');
        showSection('home');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed', 'error');
    }
}

// Product management functions
async function handleAddProduct(e) {
    e.preventDefault();
    
    if (!window.currentUser || window.userType !== 'seller') {
        showToast('Only sellers can add products', 'error');
        return;
    }
    
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const stock = parseInt(document.getElementById('productStock').value);
    
    if (!name || !description || !price || !category || !stock || !selectedImageFile) {
        showToast('Please fill in all fields and select an image', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Upload image first
        const imageUrl = await uploadImage(selectedImageFile);
        
        // Add product to Firestore
        await window.firebase.addDoc(
            window.firebase.collection(window.firebase.db, 'products'),
            {
                name: name,
                description: description,
                price: price,
                category: category,
                image: imageUrl,
                stock: stock,
                sellerId: window.currentUser.uid,
                sellerName: window.currentUser.displayName || 'Unknown Seller',
                status: 'active',
                createdAt: new Date()
            }
        );
        
        showToast('Product added successfully!', 'success');
        closeModal('addProductModal');
        document.getElementById('addProductForm').reset();
        document.getElementById('imagePreview').innerHTML = '<p>Image preview will appear here</p>';
        selectedImageFile = null;
        
        await loadProducts();
        
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Error adding product. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load products
async function loadProducts() {
    try {
        let productsSnapshot;
        try {
            productsSnapshot = await window.firebase.getDocs(
                window.firebase.query(
                    window.firebase.collection(window.firebase.db, 'products'),
                    window.firebase.where('status', '==', 'active'),
                    window.firebase.orderBy('createdAt', 'desc')
                )
            );
        } catch (indexError) {
            console.warn('Complex query failed, trying simple query:', indexError);
            productsSnapshot = await window.firebase.getDocs(
                window.firebase.collection(window.firebase.db, 'products')
            );
        }
        
        products = [];
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (!data.status || data.status === 'active') {
                products.push({ id: doc.id, ...data });
            }
        });
        
        products.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toDate() - a.createdAt.toDate();
            }
            return 0;
        });
        
        displayProducts(products, 'productsGrid');
        displayProducts(products.slice(0, 6), 'featuredProducts');
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products. Please check your internet connection.', 'error');
        displayProducts([], 'productsGrid');
        displayProducts([], 'featuredProducts');
    }
}

function displayProducts(productsArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (productsArray.length === 0) {
        container.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }
    
    container.innerHTML = productsArray.map(product => `
        <div class="product-card" onclick="showProductDetails('${product.id}')">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">₵${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); buyProduct('${product.id}')">
                        <i class="fas fa-shopping-cart"></i> Buy Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility functions
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        if (sectionName === 'products') {
            loadProducts();
        } else if (sectionName === 'dashboard' && window.currentUser) {
            loadDashboardData();
        }
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Load dashboard data function
async function loadDashboardData() {
    if (!window.currentUser) return;
    
    try {
        if (window.userType === 'seller') {
            await loadUserProducts();
        }
        
        await loadUserOrders();
        
        if (window.userType === 'affiliate') {
            await loadUserCommissions();
        }
        
        await loadUserWithdrawals();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadUserProducts() {
    try {
        const productsSnapshot = await window.firebase.getDocs(
            window.firebase.query(
                window.firebase.collection(window.firebase.db, 'products'),
                window.firebase.where('sellerId', '==', window.currentUser.uid)
            )
        );
        
        const userProducts = [];
        productsSnapshot.forEach(doc => {
            userProducts.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserProducts(userProducts);
    } catch (error) {
        console.error('Error loading user products:', error);
    }
}

function displayUserProducts(productsArray) {
    const container = document.getElementById('dashboardProductsList');
    if (!container) return;
    
    if (productsArray.length === 0) {
        container.innerHTML = '<p>No products found. <button class="btn btn-primary" onclick="showAddProduct()">Add your first product</button></p>';
        return;
    }
    
    container.innerHTML = productsArray.map(product => `
        <div class="product-item">
            <img src="${product.image}" alt="${product.name}" class="product-item-image">
            <div class="product-item-info">
                <h4>${product.name}</h4>
                <p>₵${product.price.toFixed(2)} • Stock: ${product.stock}</p>
                <p class="product-item-description">${product.description}</p>
            </div>
            <div class="product-item-actions">
                <button class="btn btn-outline" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function loadUserOrders() {
    try {
        const ordersSnapshot = await window.firebase.getDocs(
            window.firebase.query(
                window.firebase.collection(window.firebase.db, 'orders'),
                window.firebase.where('customerId', '==', window.currentUser.uid)
            )
        );
        
        orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserOrders(orders);
    } catch (error) {
        console.error('Error loading user orders:', error);
    }
}

function displayUserOrders(ordersArray) {
    const container = document.getElementById('dashboardOrdersList');
    if (!container) return;
    
    if (ordersArray.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    container.innerHTML = ordersArray.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>Order #${order.id.substring(0, 8)}</h4>
                <p>Amount: ₵${order.amount.toFixed(2)}</p>
                <p>Status: ${order.status}</p>
                <p>Date: ${new Date(order.createdAt.toDate()).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

async function loadUserCommissions() {
    try {
        const commissionsSnapshot = await window.firebase.getDocs(
            window.firebase.query(
                window.firebase.collection(window.firebase.db, 'commissions'),
                window.firebase.where('affiliateId', '==', window.currentUser.uid)
            )
        );
        
        commissions = [];
        commissionsSnapshot.forEach(doc => {
            commissions.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserCommissions(commissions);
    } catch (error) {
        console.error('Error loading user commissions:', error);
    }
}

function displayUserCommissions(commissionsArray) {
    const container = document.getElementById('affiliateLinksList');
    if (!container) return;
    
    if (commissionsArray.length === 0) {
        container.innerHTML = '<p>No commissions found. Start sharing your affiliate links!</p>';
        return;
    }
    
    container.innerHTML = commissionsArray.map(commission => `
        <div class="commission-item">
            <div class="commission-info">
                <h4>Commission: ₵${commission.amount.toFixed(2)}</h4>
                <p>Status: ${commission.status}</p>
                <p>Date: ${new Date(commission.createdAt.toDate()).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

async function loadUserWithdrawals() {
    try {
        const withdrawalsSnapshot = await window.firebase.getDocs(
            window.firebase.query(
                window.firebase.collection(window.firebase.db, 'withdrawals'),
                window.firebase.where('userId', '==', window.currentUser.uid)
            )
        );
        
        const withdrawals = [];
        withdrawalsSnapshot.forEach(doc => {
            withdrawals.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserWithdrawals(withdrawals);
    } catch (error) {
        console.error('Error loading user withdrawals:', error);
    }
}

function displayUserWithdrawals(withdrawalsArray) {
    const container = document.getElementById('withdrawalHistory');
    if (!container) return;
    
    if (withdrawalsArray.length === 0) {
        container.innerHTML = '<p>No withdrawal history.</p>';
        return;
    }
    
    container.innerHTML = withdrawalsArray.map(withdrawal => `
        <div class="withdrawal-item">
            <div class="withdrawal-info">
                <h4>₵${withdrawal.amount.toFixed(2)}</h4>
                <p>Status: ${withdrawal.status}</p>
                <p>MoMo: ${withdrawal.momoNumber}</p>
                <p>Date: ${new Date(withdrawal.createdAt.toDate()).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

async function updateDashboardStats() {
    try {
        const userDoc = await window.firebase.getDoc(
            window.firebase.doc(window.firebase.db, 'users', window.currentUser.uid)
        );
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            document.getElementById('dashboardTotalSales').textContent = `₵${userData.totalEarnings?.toFixed(2) || '0.00'}`;
            document.getElementById('dashboardTotalEarnings').textContent = `₵${userData.totalEarnings?.toFixed(2) || '0.00'}`;
            document.getElementById('dashboardTotalOrders').textContent = userData.totalSales || '0';
            document.getElementById('dashboardPendingBalance').textContent = `₵${userData.balance?.toFixed(2) || '0.00'}`;
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

async function handleWithdrawal(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const momoNumber = document.getElementById('withdrawalMomo').value;
    
    if (!amount || !momoNumber) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (amount < 10) {
        showToast('Minimum withdrawal amount is ₵10', 'error');
        return;
    }
    
    const userDoc = await window.firebase.getDoc(
        window.firebase.doc(window.firebase.db, 'users', window.currentUser.uid)
    );
    
    if (!userDoc.exists()) {
        showToast('User data not found', 'error');
        return;
    }
    
    const userData = userDoc.data();
    if (userData.balance < amount) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await window.firebase.addDoc(
            window.firebase.collection(window.firebase.db, 'withdrawals'),
            {
                userId: window.currentUser.uid,
                amount: amount,
                momoNumber: momoNumber,
                status: 'pending',
                createdAt: new Date()
            }
        );
        
        await window.firebase.updateDoc(
            window.firebase.doc(window.firebase.db, 'users', window.currentUser.uid),
            {
                balance: window.firebase.increment(-amount)
            }
        );
        
        showToast('Withdrawal request submitted successfully!', 'success');
        document.getElementById('withdrawalForm').reset();
        
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showToast('Error processing withdrawal. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadStats() {
    try {
        const statsDoc = await window.firebase.getDoc(
            window.firebase.doc(window.firebase.db, 'analytics', 'platform')
        );
        
        if (statsDoc.exists()) {
            const stats = statsDoc.data();
            
            document.getElementById('totalProducts').textContent = stats.totalProducts || '0';
            document.getElementById('totalSellers').textContent = stats.totalSellers || '0';
            document.getElementById('totalAffiliates').textContent = stats.totalAffiliates || '0';
        } else {
            document.getElementById('totalProducts').textContent = '0';
            document.getElementById('totalSellers').textContent = '0';
            document.getElementById('totalAffiliates').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalSellers').textContent = '0';
        document.getElementById('totalAffiliates').textContent = '0';
    }
}

function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modalContent = document.getElementById('productModalContent');
    modalContent.innerHTML = `
        <div class="product-details">
            <div class="product-details-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
            </div>
            <div class="product-details-info">
                <h2>${product.name}</h2>
                <p class="product-details-description">${product.description}</p>
                <div class="product-details-price">₵${product.price.toFixed(2)}</div>
                <div class="product-details-meta">
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Stock:</strong> ${product.stock}</p>
                    <p><strong>Seller:</strong> ${product.sellerName}</p>
                </div>
                <button class="btn btn-primary btn-lg" onclick="buyProduct('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Buy Now - ₵${product.price.toFixed(2)}
                </button>
            </div>
        </div>
    `;
    
    showModal('productModal');
}

async function buyProduct(productId) {
    if (!window.currentUser) {
        showToast('Please login to purchase products', 'error');
        showLogin();
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const email = window.currentUser.email;
    const momoNumber = prompt('Enter your Mobile Money number (e.g., 0241234567):');
    
    if (!momoNumber) {
        showToast('Mobile Money number is required', 'error');
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateId = urlParams.get('ref') || null;
    
    payWithPaystack(product.price, email, momoNumber, productId, product.sellerId, affiliateId);
}

function payWithPaystack(amount, email, momoNumber, productId, sellerId, affiliateId) {
    const handler = PaystackPop.setup({
        key: window.PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100,
        currency: 'GHS',
        metadata: {
            custom_fields: [
                { display_name: "Customer MoMo", variable_name: "customer_momo", value: momoNumber },
                { display_name: "Product ID", variable_name: "product_id", value: productId },
                { display_name: "Seller ID", variable_name: "seller_id", value: sellerId },
                { display_name: "Affiliate ID", variable_name: "affiliate_id", value: affiliateId || "none" },
            ]
        },
        callback: function(response) {
            verifyPayment(response.reference, productId, sellerId, affiliateId, amount, momoNumber);
        },
        onClose: function() {
            showToast('Payment cancelled', 'warning');
        }
    });
    
    handler.openIframe();
}

async function verifyPayment(reference, productId, sellerId, affiliateId, amount, momoNumber) {
    showLoading(true);
    
    try {
        const orderData = {
            productId: productId,
            customerId: window.currentUser.uid,
            sellerId: sellerId,
            affiliateId: affiliateId || null,
            amount: amount,
            momoNumber: momoNumber,
            reference: reference,
            status: 'completed',
            createdAt: new Date()
        };
        
        const orderRef = await window.firebase.addDoc(
            window.firebase.collection(window.firebase.db, 'orders'),
            orderData
        );
        
        const platformCommission = affiliateId ? amount * 0.02 : amount * 0.10;
        const affiliateCommission = affiliateId ? amount * 0.08 : 0;
        const sellerAmount = amount * 0.90;
        
        if (sellerId) {
            const sellerRef = window.firebase.doc(window.firebase.db, 'users', sellerId);
            await window.firebase.updateDoc(sellerRef, {
                balance: window.firebase.increment(sellerAmount),
                totalEarnings: window.firebase.increment(sellerAmount),
                totalSales: window.firebase.increment(1)
            });
        }
        
        if (affiliateId && affiliateCommission > 0) {
            const affiliateRef = window.firebase.doc(window.firebase.db, 'users', affiliateId);
            await window.firebase.updateDoc(affiliateRef, {
                balance: window.firebase.increment(affiliateCommission),
                totalEarnings: window.firebase.increment(affiliateCommission)
            });
            
            await window.firebase.addDoc(
                window.firebase.collection(window.firebase.db, 'commissions'),
                {
                    affiliateId: affiliateId,
                    orderId: orderRef.id,
                    amount: affiliateCommission,
                    status: 'completed',
                    createdAt: new Date()
                }
            );
        }
        
        showToast('Payment successful! Order placed.', 'success');
        closeModal('productModal');
        
        await loadInitialData();
        
    } catch (error) {
        console.error('Payment verification error:', error);
        showToast('Payment verification failed. Please contact support.', 'error');
    } finally {
        showLoading(false);
    }
}

function showDashboardTab(tabName) {
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`dashboard${tabName.charAt(0).toUpperCase() + tabName.slice(1).replace('-', '')}`);
    if (targetTab) {
        targetTab.classList.add('active');
        currentDashboardTab = tabName;
        
        document.querySelectorAll('.dashboard-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick="showDashboardTab('${tabName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        loadDashboardTabData(tabName);
    }
}

function loadDashboardTabData(tabName) {
    switch(tabName) {
        case 'overview':
            updateDashboardStats();
            break;
        case 'products':
            loadUserProducts();
            break;
        case 'orders':
            loadUserOrders();
            break;
        case 'earnings':
            break;
        case 'affiliate-links':
            loadUserCommissions();
            break;
        case 'withdrawals':
            loadUserWithdrawals();
            break;
        // Admin tabs
        case 'admin-users':
            loadAllUsers();
            break;
        case 'admin-products':
            loadAllProducts();
            break;
        case 'admin-orders':
            loadAllOrders();
            break;
        case 'admin-withdrawals':
            loadAllWithdrawals();
            break;
        case 'admin-commissions':
            loadAllCommissions();
            break;
        case 'admin-analytics':
            loadPlatformAnalytics();
            break;
    }
}

function showProfile() {
    showSection('profile');
    
    if (window.currentUser) {
        window.firebase.getDoc(window.firebase.doc(window.firebase.db, 'users', window.currentUser.uid))
            .then(docSnap => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    document.getElementById('profileName').value = userData.name || '';
                    document.getElementById('profileEmail').value = userData.email || '';
                    document.getElementById('profileType').value = userData.type || '';
                }
            });
    }
}

// Global functions for HTML onclick handlers
window.showSection = showSection;
window.showLogin = () => showModal('loginModal');
window.showRegister = () => showModal('registerModal');
window.showForgotPassword = () => showModal('forgotPasswordModal');
window.showAddProduct = () => showModal('addProductModal');
window.closeModal = closeModal;
window.logout = logout;
window.showDashboard = () => showSection('dashboard');
window.showProfile = showProfile;
window.showProductDetails = showProductDetails;
window.buyProduct = buyProduct;
window.showDashboardTab = showDashboardTab;
window.showAffiliateRegister = () => {
    document.getElementById('registerType').value = 'affiliate';
    showModal('registerModal');
};
window.showSellerRegister = () => {
    document.getElementById('registerType').value = 'seller';
    showModal('registerModal');
};
window.filterProducts = () => {
    const category = document.getElementById('categoryFilter').value;
    const filteredProducts = category ? products.filter(p => p.category === category) : products;
    displayProducts(filteredProducts, 'productsGrid');
};
window.searchProducts = () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts, 'productsGrid');
};
window.editProduct = (productId) => {
    showToast('Edit functionality coming soon!', 'info');
};
window.deleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await window.firebase.updateDoc(
                window.firebase.doc(window.firebase.db, 'products', productId),
                { status: 'deleted' }
            );
            showToast('Product deleted successfully', 'success');
            await loadUserProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Error deleting product', 'error');
        }
    }
};

// Admin Functions
async function loadAllUsers() {
    if (!window.currentUser) return;
    
    try {
        const idToken = await window.currentUser.getIdToken();
        const response = await fetch('/api/get-all-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAllUsers(data.users);
        } else {
            showToast('Error loading users: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

function displayAllUsers(users) {
    const container = document.getElementById('adminUsersTable');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-header">
            <div style="display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                <div>Name</div>
                <div>Email</div>
                <div>Type</div>
                <div>Balance</div>
                <div>Earnings</div>
                <div>Joined</div>
            </div>
        </div>
        ${users.map(user => `
            <div class="admin-table-row">
                <div style="display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;" class="admin-table-cell">
                    <div>${user.name}</div>
                    <div>${user.email}</div>
                    <div><span class="user-type-badge user-type-${user.type}">${user.type}</span></div>
                    <div>₵${user.balance?.toFixed(2) || '0.00'}</div>
                    <div>₵${user.totalEarnings?.toFixed(2) || '0.00'}</div>
                    <div>${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadAllProducts() {
    try {
        const productsSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'products')
        );
        
        const products = [];
        productsSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        displayAllProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
    }
}

function displayAllProducts(products) {
    const container = document.getElementById('adminProductsTable');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-header">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                <div>Product</div>
                <div>Price</div>
                <div>Stock</div>
                <div>Status</div>
                <div>Seller</div>
                <div>Actions</div>
            </div>
        </div>
        ${products.map(product => `
            <div class="admin-table-row">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;" class="admin-table-cell">
                    <div>
                        <strong>${product.name}</strong>
                        <br><small>${product.description?.substring(0, 50)}...</small>
                    </div>
                    <div>₵${product.price?.toFixed(2) || '0.00'}</div>
                    <div>${product.stock || 0}</div>
                    <div><span class="status-badge status-${product.status || 'active'}">${product.status || 'active'}</span></div>
                    <div>${product.sellerName || 'Unknown'}</div>
                    <div class="admin-actions">
                        <button class="admin-btn admin-btn-edit" onclick="editProductAsAdmin('${product.id}')">Edit</button>
                        <button class="admin-btn admin-btn-delete" onclick="deleteProductAsAdmin('${product.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadAllOrders() {
    try {
        const ordersSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'orders')
        );
        
        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        displayAllOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders', 'error');
    }
}

function displayAllOrders(orders) {
    const container = document.getElementById('adminOrdersTable');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-header">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                <div>Order ID</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Customer</div>
                <div>Date</div>
                <div>Reference</div>
            </div>
        </div>
        ${orders.map(order => `
            <div class="admin-table-row">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;" class="admin-table-cell">
                    <div>#${order.id.substring(0, 8)}</div>
                    <div>₵${order.amount?.toFixed(2) || '0.00'}</div>
                    <div><span class="status-badge status-${order.status}">${order.status}</span></div>
                    <div>${order.customerId?.substring(0, 8)}...</div>
                    <div>${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}</div>
                    <div>${order.reference || 'N/A'}</div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadAllWithdrawals() {
    if (!window.currentUser) return;
    
    try {
        const idToken = await window.currentUser.getIdToken();
        const response = await fetch('/api/get-all-withdrawals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAllWithdrawals(data.withdrawals);
        } else {
            showToast('Error loading withdrawals: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        showToast('Error loading withdrawals', 'error');
    }
}

function displayAllWithdrawals(withdrawals) {
    const container = document.getElementById('adminWithdrawalsTable');
    if (!container) return;
    
    if (withdrawals.length === 0) {
        container.innerHTML = '<p>No withdrawals found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-header">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                <div>User</div>
                <div>Amount</div>
                <div>MoMo Number</div>
                <div>Status</div>
                <div>Date</div>
                <div>Reason</div>
                <div>Actions</div>
            </div>
        </div>
        ${withdrawals.map(withdrawal => `
            <div class="admin-table-row">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;" class="admin-table-cell">
                    <div>${withdrawal.user?.name || 'Unknown'}</div>
                    <div>₵${withdrawal.amount?.toFixed(2) || '0.00'}</div>
                    <div>${withdrawal.momoNumber}</div>
                    <div><span class="status-badge status-${withdrawal.status}">${withdrawal.status}</span></div>
                    <div>${withdrawal.createdAt ? new Date(withdrawal.createdAt.toDate()).toLocaleDateString() : 'N/A'}</div>
                    <div>${withdrawal.rejectionReason || '-'}</div>
                    <div class="admin-actions">
                        ${withdrawal.status === 'pending' ? `
                            <button class="admin-btn admin-btn-approve" onclick="approveWithdrawal('${withdrawal.id}')">Approve</button>
                            <button class="admin-btn admin-btn-reject" onclick="rejectWithdrawal('${withdrawal.id}')">Reject</button>
                        ` : '-'}
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadAllCommissions() {
    try {
        const commissionsSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'commissions')
        );
        
        const commissions = [];
        commissionsSnapshot.forEach(doc => {
            commissions.push({ id: doc.id, ...doc.data() });
        });
        
        displayAllCommissions(commissions);
    } catch (error) {
        console.error('Error loading commissions:', error);
        showToast('Error loading commissions', 'error');
    }
}

function displayAllCommissions(commissions) {
    const container = document.getElementById('adminCommissionsTable');
    if (!container) return;
    
    if (commissions.length === 0) {
        container.innerHTML = '<p>No commissions found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-header">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                <div>Affiliate ID</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Order ID</div>
                <div>Date</div>
            </div>
        </div>
        ${commissions.map(commission => `
            <div class="admin-table-row">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;" class="admin-table-cell">
                    <div>${commission.affiliateId?.substring(0, 8)}...</div>
                    <div>₵${commission.amount?.toFixed(2) || '0.00'}</div>
                    <div><span class="status-badge status-${commission.status}">${commission.status}</span></div>
                    <div>#${commission.orderId?.substring(0, 8)}...</div>
                    <div>${commission.createdAt ? new Date(commission.createdAt.toDate()).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadPlatformAnalytics() {
    if (!window.currentUser) return;
    
    try {
        const idToken = await window.currentUser.getIdToken();
        const response = await fetch('/api/get-platform-stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayPlatformAnalytics(data.stats);
        } else {
            showToast('Error loading analytics: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Error loading analytics', 'error');
    }
}

function displayPlatformAnalytics(stats) {
    // Update analytics cards
    document.getElementById('totalRevenue').textContent = `₵${stats.revenue?.total?.toFixed(2) || '0.00'}`;
    document.getElementById('totalUsersCount').textContent = stats.users?.total || '0';
    document.getElementById('totalOrdersCount').textContent = stats.orders?.total || '0';
    document.getElementById('activeProductsCount').textContent = stats.products?.active || '0';
    
    // Update user breakdown
    const breakdown = document.getElementById('usersBreakdown');
    if (breakdown) {
        breakdown.innerHTML = `
            <span>Customers: ${stats.users?.customers || 0}</span>
            <span>Sellers: ${stats.users?.sellers || 0}</span>
            <span>Affiliates: ${stats.users?.affiliates || 0}</span>
        `;
    }
    
    // Update growth indicators
    document.getElementById('revenueChange').textContent = `₵${stats.revenue?.monthly?.toFixed(2) || '0.00'} this month`;
    document.getElementById('ordersChange').textContent = `+${stats.growth?.newOrders || 0} this month`;
    document.getElementById('productsChange').textContent = `+${stats.growth?.newUsers || 0} new users`;
}

async function approveWithdrawal(withdrawalId) {
    if (!window.currentUser) return;
    
    if (!confirm('Are you sure you want to approve this withdrawal?')) {
        return;
    }
    
    try {
        const idToken = await window.currentUser.getIdToken();
        const response = await fetch('/api/approve-withdrawal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken, withdrawalId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Withdrawal approved successfully', 'success');
            loadAllWithdrawals();
        } else {
            showToast('Error approving withdrawal: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showToast('Error approving withdrawal', 'error');
    }
}

async function rejectWithdrawal(withdrawalId) {
    if (!window.currentUser) return;
    
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    if (!confirm('Are you sure you want to reject this withdrawal?')) {
        return;
    }
    
    try {
        const idToken = await window.currentUser.getIdToken();
        const response = await fetch('/api/reject-withdrawal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken, withdrawalId, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Withdrawal rejected and amount refunded', 'success');
            loadAllWithdrawals();
        } else {
            showToast('Error rejecting withdrawal: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showToast('Error rejecting withdrawal', 'error');
    }
}

async function deleteProductAsAdmin(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        await window.firebase.updateDoc(
            window.firebase.doc(window.firebase.db, 'products', productId),
            { status: 'deleted' }
        );
        showToast('Product deleted successfully', 'success');
        loadAllProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Error deleting product', 'error');
    }
}

function editProductAsAdmin(productId) {
    showToast('Edit functionality coming soon!', 'info');
}

// Filter functions for admin tables
function filterUsers() {
    const typeFilter = document.getElementById('userTypeFilter').value;
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    
    // This would filter the displayed users
    // Implementation depends on how you want to handle filtering
    showToast('Filter functionality coming soon!', 'info');
}

function searchUsers() {
    filterUsers();
}

function filterAdminProducts() {
    showToast('Filter functionality coming soon!', 'info');
}

function searchAdminProducts() {
    filterAdminProducts();
}

function filterAdminOrders() {
    showToast('Filter functionality coming soon!', 'info');
}

function filterAdminWithdrawals() {
    showToast('Filter functionality coming soon!', 'info');
}

function filterAdminCommissions() {
    showToast('Filter functionality coming soon!', 'info');
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
