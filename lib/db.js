// Database connection and query helpers
import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to execute queries
export async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Initialize database tables
export async function initDatabase() {
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('customer', 'seller', 'affiliate', 'admin')),
      balance DECIMAL(10,2) DEFAULT 0,
      total_earnings DECIMAL(10,2) DEFAULT 0,
      total_sales INTEGER DEFAULT 0,
      email_verified BOOLEAN DEFAULT false,
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      seller_id UUID REFERENCES users(id),
      seller_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id),
      customer_id UUID REFERENCES users(id),
      seller_id UUID REFERENCES users(id),
      affiliate_id UUID REFERENCES users(id),
      amount DECIMAL(10,2) NOT NULL,
      momo_number VARCHAR(20),
      reference VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Commissions table
    CREATE TABLE IF NOT EXISTS commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      affiliate_id UUID REFERENCES users(id),
      order_id UUID REFERENCES orders(id),
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Withdrawals table
    CREATE TABLE IF NOT EXISTS withdrawals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      amount DECIMAL(10,2) NOT NULL,
      momo_number VARCHAR(20) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      approved_at TIMESTAMP WITH TIME ZONE,
      rejected_at TIMESTAMP WITH TIME ZONE,
      approved_by UUID REFERENCES users(id),
      rejected_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Analytics table
    CREATE TABLE IF NOT EXISTS analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      platform VARCHAR(100) DEFAULT 'platform',
      total_products INTEGER DEFAULT 0,
      total_sellers INTEGER DEFAULT 0,
      total_affiliates INTEGER DEFAULT 0,
      total_revenue DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
    CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
  `;

  try {
    await query(createTables);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User queries
export async function createUser(userData) {
  const { email, passwordHash, name, type } = userData;
  const result = await query(
    'INSERT INTO users (email, password_hash, name, type) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, passwordHash, name, type]
  );
  return result.rows[0];
}

export async function getUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function getUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateUser(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await query(
    `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

// Product queries
export async function createProduct(productData) {
  const { name, description, price, category, imageUrl, stock, sellerId, sellerName } = productData;
  const result = await query(
    'INSERT INTO products (name, description, price, category, image_url, stock, seller_id, seller_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [name, description, price, category, imageUrl, stock, sellerId, sellerName]
  );
  return result.rows[0];
}

export async function getProducts(filters = {}) {
  let queryText = 'SELECT * FROM products WHERE status = $1';
  const params = ['active'];
  
  if (filters.category) {
    queryText += ' AND category = $2';
    params.push(filters.category);
  }
  
  if (filters.sellerId) {
    queryText += ' AND seller_id = $' + (params.length + 1);
    params.push(filters.sellerId);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, params);
  return result.rows;
}

export async function updateProduct(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await query(
    `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

// Order queries
export async function createOrder(orderData) {
  const { productId, customerId, sellerId, affiliateId, amount, momoNumber, reference } = orderData;
  const result = await query(
    'INSERT INTO orders (product_id, customer_id, seller_id, affiliate_id, amount, momo_number, reference) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [productId, customerId, sellerId, affiliateId, amount, momoNumber, reference]
  );
  return result.rows[0];
}

export async function getOrdersByUserId(userId) {
  const result = await query(
    'SELECT * FROM orders WHERE customer_id = $1 OR seller_id = $1 OR affiliate_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

// Commission queries
export async function createCommission(commissionData) {
  const { affiliateId, orderId, amount } = commissionData;
  const result = await query(
    'INSERT INTO commissions (affiliate_id, order_id, amount) VALUES ($1, $2, $3) RETURNING *',
    [affiliateId, orderId, amount]
  );
  return result.rows[0];
}

export async function getCommissionsByUserId(userId) {
  const result = await query(
    'SELECT * FROM commissions WHERE affiliate_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

// Withdrawal queries
export async function createWithdrawal(withdrawalData) {
  const { userId, amount, momoNumber } = withdrawalData;
  const result = await query(
    'INSERT INTO withdrawals (user_id, amount, momo_number) VALUES ($1, $2, $3) RETURNING *',
    [userId, amount, momoNumber]
  );
  return result.rows[0];
}

export async function getWithdrawalsByUserId(userId) {
  const result = await query(
    'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function getAllWithdrawals() {
  const result = await query(`
    SELECT w.*, u.name as user_name, u.email as user_email, u.type as user_type
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.created_at DESC
  `);
  return result.rows;
}

export async function updateWithdrawal(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  
  const result = await query(
    `UPDATE withdrawals SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

// Analytics queries
export async function getPlatformStats() {
  const [usersResult, productsResult, ordersResult, withdrawalsResult, commissionsResult] = await Promise.all([
    query('SELECT type, COUNT(*) as count FROM users GROUP BY type'),
    query('SELECT status, COUNT(*) as count FROM products GROUP BY status'),
    query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM orders GROUP BY status'),
    query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM withdrawals GROUP BY status'),
    query('SELECT status, COUNT(*) as count, SUM(amount) as total FROM commissions GROUP BY status')
  ]);

  const userStats = {};
  usersResult.rows.forEach(row => {
    userStats[row.type] = parseInt(row.count);
  });

  const productStats = {};
  productsResult.rows.forEach(row => {
    productStats[row.status] = parseInt(row.count);
  });

  const orderStats = {};
  let totalRevenue = 0;
  ordersResult.rows.forEach(row => {
    orderStats[row.status] = parseInt(row.count);
    if (row.status === 'completed') {
      totalRevenue += parseFloat(row.total || 0);
    }
  });

  const withdrawalStats = {};
  let totalWithdrawals = 0;
  withdrawalsResult.rows.forEach(row => {
    withdrawalStats[row.status] = parseInt(row.count);
    if (row.status === 'approved') {
      totalWithdrawals += parseFloat(row.total || 0);
    }
  });

  const commissionStats = {};
  let totalCommissions = 0;
  commissionsResult.rows.forEach(row => {
    commissionStats[row.status] = parseInt(row.count);
    if (row.status === 'completed') {
      totalCommissions += parseFloat(row.total || 0);
    }
  });

  return {
    users: {
      total: Object.values(userStats).reduce((sum, count) => sum + count, 0),
      customers: userStats.customer || 0,
      sellers: userStats.seller || 0,
      affiliates: userStats.affiliate || 0,
      admins: userStats.admin || 0
    },
    products: {
      total: Object.values(productStats).reduce((sum, count) => sum + count, 0),
      active: productStats.active || 0
    },
    orders: {
      total: Object.values(orderStats).reduce((sum, count) => sum + count, 0),
      completed: orderStats.completed || 0,
      pending: orderStats.pending || 0,
      cancelled: orderStats.cancelled || 0
    },
    revenue: {
      total: totalRevenue,
      monthly: totalRevenue // Simplified - could calculate monthly separately
    },
    withdrawals: {
      total: Object.values(withdrawalStats).reduce((sum, count) => sum + count, 0),
      pending: withdrawalStats.pending || 0,
      approved: withdrawalStats.approved || 0,
      rejected: withdrawalStats.rejected || 0,
      totalAmount: totalWithdrawals
    },
    commissions: {
      total: Object.values(commissionStats).reduce((sum, count) => sum + count, 0),
      completed: commissionStats.completed || 0,
      pending: commissionStats.pending || 0,
      totalAmount: totalCommissions
    }
  };
}

export async function getAllUsers() {
  const result = await query('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows;
}

export async function getAllProducts() {
  const result = await query(`
    SELECT p.*, u.name as seller_name
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    ORDER BY p.created_at DESC
  `);
  return result.rows;
}

export async function getAllOrders() {
  const result = await query(`
    SELECT o.*, p.name as product_name, u.name as customer_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.customer_id = u.id
    ORDER BY o.created_at DESC
  `);
  return result.rows;
}

export async function getAllCommissions() {
  const result = await query(`
    SELECT c.*, u.name as affiliate_name
    FROM commissions c
    LEFT JOIN users u ON c.affiliate_id = u.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
}
