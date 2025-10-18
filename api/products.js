// Products API endpoint
import { getProducts, createProduct, updateProduct, getAllProducts } from '../lib/db.js';
import { verifyAuthFromCookie, verifyAuth, requireAdmin } from '../lib/auth.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get products
      const { category, sellerId, admin } = req.query;
      
      let products;
      if (admin === 'true') {
        // Admin view - get all products
        const decoded = await requireAdmin(req);
        products = await getAllProducts();
      } else {
        // Public/seller view - get filtered products
        const filters = {};
        if (category) filters.category = category;
        if (sellerId) filters.sellerId = sellerId;
        
        products = await getProducts(filters);
      }

      res.status(200).json({
        success: true,
        products
      });

    } else if (req.method === 'POST') {
      // Create product
      const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { name, description, price, category, imageUrl, stock } = req.body;

      if (!name || !description || !price || !category || !imageUrl || !stock) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user is seller
      if (decoded.type !== 'seller') {
        return res.status(403).json({ error: 'Only sellers can create products' });
      }

      const product = await createProduct({
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        stock: parseInt(stock),
        sellerId: decoded.userId,
        sellerName: decoded.name || 'Unknown Seller'
      });

      res.status(201).json({
        success: true,
        product
      });

    } else if (req.method === 'PUT') {
      // Update product
      const decoded = verifyAuthFromCookie(req) || verifyAuth(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Check if user is admin or product owner
      const isAdmin = decoded.type === 'admin';
      if (!isAdmin) {
        // For non-admins, verify they own the product
        const products = await getProducts({ sellerId: decoded.userId });
        const productExists = products.some(p => p.id === id);
        if (!productExists) {
          return res.status(403).json({ error: 'You can only update your own products' });
        }
      }

      const product = await updateProduct(id, updates);

      res.status(200).json({
        success: true,
        product
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
