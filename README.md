# MarketPlate - Full Vercel Migration

A complete affiliate marketplace platform built with Vercel Postgres, Vercel Blob, and JWT authentication.

## Features

- **User Management**: Registration, login, user roles (customer, seller, affiliate, admin)
- **Product Management**: Create, read, update, delete products with image uploads
- **Order Processing**: Complete order flow with payment integration
- **Affiliate System**: Commission tracking and management
- **Withdrawal System**: Mobile Money withdrawal requests
- **Admin Dashboard**: Complete admin panel for platform management

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Vercel Postgres
- **Storage**: Vercel Blob
- **Authentication**: JWT with bcrypt
- **Deployment**: Vercel

## Setup Instructions

### 1. Vercel Project Setup

1. Create a new Vercel project
2. Connect your GitHub repository
3. Set up Vercel Postgres database
4. Set up Vercel Blob storage

### 2. Environment Variables

Set these environment variables in your Vercel project:

```bash
# Database
DATABASE_URL=your_vercel_postgres_connection_string

# JWT Secret (generate a strong secret)
JWT_SECRET=your_jwt_secret_key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 3. Database Initialization

After deploying, call the initialization endpoint to create tables:

```bash
curl -X POST https://your-domain.vercel.app/api/init-db
```

### 4. Create Admin User

1. Register a regular user through the app
2. In Vercel Postgres dashboard, update the user's `type` to `'admin'`:

```sql
UPDATE users SET type = 'admin' WHERE email = 'your-admin-email@example.com';
```

### 5. Deploy

```bash
vercel --prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get products (with filters)
- `POST /api/products` - Create product (seller only)
- `PUT /api/products` - Update product

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order

### Withdrawals
- `GET /api/withdrawals` - Get user withdrawals
- `POST /api/withdrawals` - Create withdrawal request

### Commissions
- `GET /api/commissions` - Get user commissions

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/orders` - Get all orders (admin only)
- `GET /api/admin/withdrawals` - Get all withdrawals (admin only)
- `POST /api/admin/withdrawals` - Approve/reject withdrawals (admin only)
- `GET /api/admin/commissions` - Get all commissions (admin only)
- `GET /api/admin/stats` - Get platform statistics (admin only)

### Uploads
- `POST /api/uploads` - Upload images to Vercel Blob

## Database Schema

The database includes these main tables:
- `users` - User accounts and profiles
- `products` - Product catalog
- `orders` - Order transactions
- `commissions` - Affiliate commissions
- `withdrawals` - Withdrawal requests
- `analytics` - Platform statistics

## Development

```bash
# Install dependencies
npm install

# Run locally
vercel dev
```

## Migration from Firebase

This project has been completely migrated from Firebase to Vercel:

- **Firebase Auth** → JWT with bcrypt
- **Firestore** → Vercel Postgres
- **Firebase Storage** → Vercel Blob
- **Firebase Admin SDK** → Custom API endpoints

All Firebase dependencies have been removed and replaced with Vercel-native solutions.

## Security

- JWT tokens are stored in HttpOnly cookies
- Password hashing with bcrypt
- Admin-only endpoints protected with role checks
- CORS configured for production domains
- Input validation on all API endpoints

## Support

For issues or questions, please check the Vercel documentation or create an issue in the repository.