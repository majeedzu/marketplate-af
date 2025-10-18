// JWT authentication helpers
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserById } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authenticate user with email and password
export async function authenticateUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    return null;
  }

  // Remove password from user object
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Middleware to verify JWT token from request
export function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded;
}

// Check if user is admin
export async function isAdmin(userId) {
  const user = await getUserById(userId);
  return user && (user.type === 'admin' || user.is_admin === true);
}

// Middleware to check admin access
export async function requireAdmin(req) {
  const decoded = verifyAuth(req);
  if (!decoded) {
    throw new Error('Authentication required');
  }

  const userIsAdmin = await isAdmin(decoded.userId);
  if (!userIsAdmin) {
    throw new Error('Admin access required');
  }

  return decoded;
}

// Set JWT cookie
export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', [
    `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
  ]);
}

// Clear auth cookie
export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', [
    'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
  ]);
}

// Get token from cookie
export function getTokenFromCookie(req) {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const authCookie = cookies
    .split(';')
    .find(cookie => cookie.trim().startsWith('auth_token='));

  if (!authCookie) return null;

  return authCookie.split('=')[1];
}

// Verify token from cookie
export function verifyAuthFromCookie(req) {
  const token = getTokenFromCookie(req);
  if (!token) return null;
  return verifyToken(token);
}
