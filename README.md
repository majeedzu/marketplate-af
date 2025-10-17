# MarketPlate - Affiliate Marketplace Platform

MarketPlate is Ghana's premier affiliate marketplace platform that connects sellers, affiliates, and customers in a seamless e-commerce ecosystem. Built with modern web technologies and deployed on Vercel.

## 🚀 Features

### For Customers
- Browse and purchase products from verified sellers
- Secure payment processing via Paystack
- Mobile Money integration for Ghana market
- Product search and filtering

### For Sellers
- Easy product listing and management
- Real-time sales analytics
- Secure payment processing
- Inventory management
- Commission tracking

### For Affiliates
- 8% commission on successful referrals
- Unique affiliate links generation
- Real-time earnings tracking
- Easy withdrawal system
- Performance analytics

### For Administrators
- Comprehensive admin dashboard
- User management (customers, sellers, affiliates)
- Product approval and management
- Order monitoring and tracking
- Withdrawal request approval system
- Platform analytics and insights
- Commission oversight

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Payment**: Paystack API
- **Deployment**: Vercel
- **Serverless Functions**: Node.js with Firebase Admin SDK

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **Firebase account** and project
3. **Paystack account** for payment processing
4. **Vercel account** for deployment
5. **Git** for version control

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd public-marketplate
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Get your Firebase configuration from Project Settings
4. Update `js/firebase-config.js` with your Firebase config

### 3. Firebase Admin SDK Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Extract the following values:
   - `project_id`
   - `client_email`
   - `private_key`

### 4. Paystack Configuration

1. Create a Paystack account at [Paystack](https://paystack.com/)
2. Get your API keys from the dashboard
3. Update the Paystack configuration in `js/firebase-config.js`

### 5. Environment Variables

1. Copy `env.template` to `.env.local`
2. Fill in your environment variables:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# Admin Configuration
ADMIN_EMAIL=admin@marketplate.com
ADMIN_PASSWORD=AdminMarketplace2024!
```

### 6. Firebase Security Rules

1. Deploy the security rules to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or manually copy the rules from `firestore.rules` to your Firebase Console.

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy the project
vercel --prod
```

### 3. Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all the environment variables from your `.env.local` file

### 4. Update Firebase Configuration

After deployment, update your Firebase configuration to allow your Vercel domain:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain (e.g., `your-app.vercel.app`)

## 👨‍💼 Admin Setup

### First-Time Admin Login

1. The admin user is automatically created on first app load
2. Default credentials:
   - **Email**: `admin@marketplate.com`
   - **Password**: `AdminMarketplace2024!`
3. **Important**: Change the password immediately after first login

### Admin Dashboard Access

1. Login with admin credentials
2. Navigate to Dashboard
3. Admin panel will be visible in the sidebar
4. Access comprehensive platform management tools

## 📱 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
vercel dev
```

The application will be available at `http://localhost:3000`

### 3. Testing

- Use the sample data functions in the browser console:
  - `populateSampleData()` - Add sample products and users
  - `clearAllData()` - Clear all test data

## 🔒 Security Features

- Firebase Authentication with email verification
- Role-based access control (Customer, Seller, Affiliate, Admin)
- Secure Firestore security rules
- Admin-only API endpoints
- Input validation and sanitization
- CORS protection for API endpoints

## 📊 API Endpoints

### Admin Endpoints (Serverless Functions)

- `POST /api/verify-admin` - Verify admin authentication
- `POST /api/get-all-users` - Get all platform users
- `POST /api/get-platform-stats` - Get platform analytics
- `POST /api/approve-withdrawal` - Approve withdrawal request
- `POST /api/reject-withdrawal` - Reject withdrawal request
- `POST /api/get-all-withdrawals` - Get all withdrawal requests

## 🎨 Customization

### Styling
- Modify `styles.css` for custom themes
- Update color scheme in CSS variables
- Customize admin dashboard appearance

### Features
- Add new user roles in `js/app.js`
- Extend admin functionality in serverless functions
- Add new product categories
- Customize commission rates

## 🐛 Troubleshooting

### Common Issues

1. **Firebase not initializing**
   - Check Firebase configuration
   - Verify API keys are correct
   - Ensure Firebase services are enabled

2. **Admin dashboard not showing**
   - Verify admin user exists in Firestore
   - Check browser console for errors
   - Ensure admin role is properly set

3. **Payment not working**
   - Verify Paystack keys are correct
   - Check Paystack webhook configuration
   - Ensure test mode is properly configured

4. **Serverless functions failing**
   - Check environment variables in Vercel
   - Verify Firebase Admin SDK configuration
   - Check function logs in Vercel dashboard

### Support

For support and questions:
- Check the browser console for error messages
- Review Firebase and Vercel logs
- Ensure all environment variables are properly set

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Contact

For questions or support, please contact the development team.

---

**MarketPlate** - Empowering Ghana's digital marketplace ecosystem.
