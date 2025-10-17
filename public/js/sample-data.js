// Sample data for testing MarketPlate
// This file contains sample products and users for development/testing purposes

const sampleProducts = [
    {
        name: "iPhone 15 Pro Max",
        description: "Latest iPhone with advanced camera system and A17 Pro chip. 256GB storage, Titanium design.",
        price: 8500.00,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
        stock: 10,
        sellerName: "TechHub Ghana",
        status: "active"
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        description: "Premium Android smartphone with S Pen, 200MP camera, and 1TB storage.",
        price: 7800.00,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500",
        stock: 8,
        sellerName: "Mobile World",
        status: "active"
    },
    {
        name: "Nike Air Max 270",
        description: "Comfortable running shoes with Air Max cushioning. Perfect for daily wear and sports.",
        price: 450.00,
        category: "fashion",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        stock: 25,
        sellerName: "Shoe Palace",
        status: "active"
    },
    {
        name: "Adidas Originals T-Shirt",
        description: "Classic cotton t-shirt with Adidas logo. Available in multiple colors and sizes.",
        price: 120.00,
        category: "fashion",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        stock: 50,
        sellerName: "Fashion Forward",
        status: "active"
    },
    {
        name: "MacBook Pro 14-inch",
        description: "Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Perfect for professionals.",
        price: 12000.00,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
        stock: 5,
        sellerName: "Apple Store Ghana",
        status: "active"
    },
    {
        name: "Garden Tool Set",
        description: "Complete gardening tool set with shovel, rake, hoe, and pruning shears. Durable steel construction.",
        price: 280.00,
        category: "home",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
        stock: 15,
        sellerName: "Green Thumb Supplies",
        status: "active"
    },
    {
        name: "Football (Soccer Ball)",
        description: "Official size 5 football with premium leather construction. Perfect for matches and training.",
        price: 150.00,
        category: "sports",
        image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=500",
        stock: 30,
        sellerName: "Sports Central",
        status: "active"
    },
    {
        name: "JavaScript: The Good Parts",
        description: "Essential JavaScript programming book by Douglas Crockford. Learn the best practices.",
        price: 85.00,
        category: "books",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
        stock: 20,
        sellerName: "Book Haven",
        status: "active"
    },
    {
        name: "Wireless Bluetooth Headphones",
        description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
        price: 350.00,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        stock: 12,
        sellerName: "Audio Tech",
        status: "active"
    },
    {
        name: "Coffee Maker",
        description: "Automatic drip coffee maker with programmable timer and thermal carafe. Makes 12 cups.",
        price: 420.00,
        category: "home",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
        stock: 8,
        sellerName: "Home Essentials",
        status: "active"
    }
];

const sampleUsers = [
    {
        name: "Kwame Asante",
        email: "kwame@example.com",
        type: "seller",
        balance: 0,
        totalEarnings: 0,
        totalSales: 0
    },
    {
        name: "Ama Osei",
        email: "ama@example.com",
        type: "affiliate",
        balance: 0,
        totalEarnings: 0,
        totalSales: 0
    },
    {
        name: "Kofi Mensah",
        email: "kofi@example.com",
        type: "customer",
        balance: 0,
        totalEarnings: 0,
        totalSales: 0
    }
];

// Function to populate sample data (for development/testing)
async function populateSampleData() {
    if (!window.firebase) {
        console.error('Firebase not initialized');
        return;
    }

    try {
        console.log('Populating sample data...');

        // Add sample products
        for (const product of sampleProducts) {
            await window.firebase.addDoc(
                window.firebase.collection(window.firebase.db, 'products'),
                {
                    ...product,
                    createdAt: new Date(),
                    sellerId: 'sample-seller-id' // Replace with actual seller ID
                }
            );
        }

        // Initialize platform stats
        await window.firebase.setDoc(
            window.firebase.doc(window.firebase.db, 'analytics', 'platform'),
            {
                totalProducts: sampleProducts.length,
                totalSellers: 1,
                totalAffiliates: 1,
                totalRevenue: 0,
                totalOrders: 0
            }
        );

        console.log('Sample data populated successfully!');
    } catch (error) {
        console.error('Error populating sample data:', error);
    }
}

// Function to clear all data (for testing)
async function clearAllData() {
    if (!window.firebase) {
        console.error('Firebase not initialized');
        return;
    }

    try {
        console.log('Clearing all data...');

        // Clear products
        const productsSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'products')
        );
        for (const doc of productsSnapshot.docs) {
            await doc.ref.delete();
        }

        // Clear orders
        const ordersSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'orders')
        );
        for (const doc of ordersSnapshot.docs) {
            await doc.ref.delete();
        }

        // Clear commissions
        const commissionsSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'commissions')
        );
        for (const doc of commissionsSnapshot.docs) {
            await doc.ref.delete();
        }

        // Clear withdrawals
        const withdrawalsSnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'withdrawals')
        );
        for (const doc of withdrawalsSnapshot.docs) {
            await doc.ref.delete();
        }

        console.log('All data cleared successfully!');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

// Make functions available globally for testing
window.populateSampleData = populateSampleData;
window.clearAllData = clearAllData;

console.log('Sample data functions loaded. Use populateSampleData() or clearAllData() in console for testing.');
