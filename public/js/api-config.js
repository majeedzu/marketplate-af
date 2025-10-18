// API configuration and helper functions
const API_BASE_URL = window.location.origin;

// Global state
window.currentUser = null;
window.userType = null;

// API helper function
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API call failed');
  }

  return await response.json();
}

// Authentication functions
async function login(email, password) {
  const response = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (response.success) {
    window.currentUser = response.user;
    window.userType = response.user.type;
    updateUIForUser(response.user);
  }
  
  return response;
}

async function register(userData) {
  const response = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (response.success) {
    window.currentUser = response.user;
    window.userType = response.user.type;
    updateUIForUser(response.user);
  }
  
  return response;
}

async function logout() {
  try {
    await apiCall('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    window.currentUser = null;
    window.userType = null;
    updateUIForGuest();
  }
}

async function getCurrentUser() {
  try {
    const response = await apiCall('/api/auth/me');
    if (response.success) {
      window.currentUser = response.user;
      window.userType = response.user.type;
      updateUIForUser(response.user);
      return response.user;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    window.currentUser = null;
    window.userType = null;
    updateUIForGuest();
  }
  return null;
}

// Product functions
async function getProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.sellerId) params.append('sellerId', filters.sellerId);
  if (filters.admin) params.append('admin', 'true');
  
  const queryString = params.toString();
  const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
  
  const response = await apiCall(endpoint);
  return response.products || [];
}

async function createProduct(productData) {
  const response = await apiCall('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  return response.product;
}

async function updateProduct(id, updates) {
  const response = await apiCall('/api/products', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates }),
  });
  return response.product;
}

// Image upload function
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }
  
  const result = await response.json();
  return result.imageUrl;
}

// Order functions
async function createOrder(orderData) {
  const response = await apiCall('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  return response.order;
}

async function getOrders() {
  const response = await apiCall('/api/orders');
  return response.orders || [];
}

// Withdrawal functions
async function createWithdrawal(withdrawalData) {
  const response = await apiCall('/api/withdrawals', {
    method: 'POST',
    body: JSON.stringify(withdrawalData),
  });
  return response.withdrawal;
}

async function getWithdrawals() {
  const response = await apiCall('/api/withdrawals');
  return response.withdrawals || [];
}

// Commission functions
async function getCommissions() {
  const response = await apiCall('/api/commissions');
  return response.commissions || [];
}

// Admin functions
async function getAllUsers() {
  const response = await apiCall('/api/admin/users');
  return response.users || [];
}

async function getAllProducts() {
  const response = await apiCall('/api/products?admin=true');
  return response.products || [];
}

async function getAllOrders() {
  const response = await apiCall('/api/admin/orders');
  return response.orders || [];
}

async function getAllWithdrawals() {
  const response = await apiCall('/api/admin/withdrawals');
  return response.withdrawals || [];
}

async function getAllCommissions() {
  const response = await apiCall('/api/admin/commissions');
  return response.commissions || [];
}

async function getPlatformStats() {
  const response = await apiCall('/api/admin/stats');
  return response.stats || {};
}

async function approveWithdrawal(withdrawalId) {
  const response = await apiCall('/api/admin/withdrawals', {
    method: 'POST',
    body: JSON.stringify({ action: 'approve', withdrawalId }),
  });
  return response;
}

async function rejectWithdrawal(withdrawalId, reason) {
  const response = await apiCall('/api/admin/withdrawals', {
    method: 'POST',
    body: JSON.stringify({ action: 'reject', withdrawalId, reason }),
  });
  return response;
}

// UI update functions
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
  if (userData.type === 'admin' || userData.is_admin) {
    showAdminNavigation();
  }
}

function updateUIForGuest() {
  const navAuth = document.getElementById('navAuth');
  const navUser = document.getElementById('navUser');
  
  if (navAuth && navUser) {
    navAuth.style.display = 'flex';
    navUser.style.display = 'none';
  }
  
  // Hide admin navigation
  const adminNav = document.getElementById('adminNav');
  if (adminNav) {
    adminNav.style.display = 'none';
  }
}

function showAdminNavigation() {
  const adminNav = document.getElementById('adminNav');
  if (adminNav) {
    adminNav.style.display = 'block';
  }
}

// Make functions globally available
window.api = {
  login,
  register,
  logout,
  getCurrentUser,
  getProducts,
  createProduct,
  updateProduct,
  uploadImage,
  createOrder,
  getOrders,
  createWithdrawal,
  getWithdrawals,
  getCommissions,
  getAllUsers,
  getAllProducts,
  getAllOrders,
  getAllWithdrawals,
  getAllCommissions,
  getPlatformStats,
  approveWithdrawal,
  rejectWithdrawal,
};

console.log('API configuration loaded');
