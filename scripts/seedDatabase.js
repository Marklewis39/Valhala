#!/usr/bin/env node

/**
 * Database Seeding Script
 * Run: node scripts/seedDatabase.js
 * This script populates the database with initial data
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  Timestamp 
} = require('firebase/firestore');
const { 
  getAuth, 
  createUserWithEmailAndPassword 
} = require('firebase/auth');

// Firebase configuration (use environment variables or .env file)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'your_api_key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'valhala.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'valhala',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'valhala.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123',
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'https://valhala-default-rtdb.firebaseio.com'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample Products Data
const products = [
  // Whiskey
  {
    name: "Jack Daniel's Old No. 7",
    brand: "Jack Daniel's",
    category: "whiskey",
    description: "Smooth Tennessee whiskey with charcoal mellowing. Perfect for sipping or mixing.",
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b",
    buyPrice: 1800,
    sellingPrice: 2500,
    stock: 50,
    lowStockThreshold: 10,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Johnnie Walker Black Label",
    brand: "Johnnie Walker",
    category: "whiskey",
    description: "Iconic blended Scotch whisky with smoky character and smooth finish.",
    imageUrl: "https://images.unsplash.com/photo-1614313913007-2d4e7acd34c3",
    buyPrice: 3500,
    sellingPrice: 4500,
    stock: 30,
    lowStockThreshold: 5,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Jameson Irish Whiskey",
    brand: "Jameson",
    category: "whiskey",
    description: "Smooth triple-distilled Irish whiskey with hints of vanilla and spice.",
    imageUrl: "https://images.unsplash.com/photo-1614313913007-2d4e7acd34c3",
    buyPrice: 2200,
    sellingPrice: 3200,
    stock: 40,
    lowStockThreshold: 8,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  
  // Beer
  {
    name: "Tusker Lager",
    brand: "Tusker",
    category: "beer",
    description: "Kenya's premium lager. Crisp, refreshing, and full of character.",
    imageUrl: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d",
    buyPrice: 150,
    sellingPrice: 250,
    stock: 200,
    lowStockThreshold: 50,
    alcoholPercentage: 4.2,
    volume: 500,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Guinness Foreign Extra",
    brand: "Guinness",
    category: "beer",
    description: "Rich, creamy stout with deep roasted flavors and a distinctive bitterness.",
    imageUrl: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148",
    buyPrice: 180,
    sellingPrice: 300,
    stock: 100,
    lowStockThreshold: 20,
    alcoholPercentage: 7.5,
    volume: 500,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Heineken",
    brand: "Heineken",
    category: "beer",
    description: "World-famous premium lager with a balanced, refreshing taste.",
    imageUrl: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d",
    buyPrice: 160,
    sellingPrice: 280,
    stock: 150,
    lowStockThreshold: 30,
    alcoholPercentage: 5.0,
    volume: 500,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  
  // Wine
  {
    name: "Savour Sauvignon Blanc",
    brand: "Savour",
    category: "wine",
    description: "Crisp white wine with citrus notes and a refreshing finish.",
    imageUrl: "https://images.unsplash.com/photo-1567172800786-9b77b6d7b4b0",
    buyPrice: 800,
    sellingPrice: 1200,
    stock: 40,
    lowStockThreshold: 10,
    alcoholPercentage: 12.5,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Savour Cabernet Sauvignon",
    brand: "Savour",
    category: "wine",
    description: "Full-bodied red wine with dark fruit flavors and smooth tannins.",
    imageUrl: "https://images.unsplash.com/photo-1567172800786-9b77b6d7b4b0",
    buyPrice: 850,
    sellingPrice: 1300,
    stock: 35,
    lowStockThreshold: 8,
    alcoholPercentage: 13.5,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  
  // Gin
  {
    name: "Bombay Sapphire Gin",
    brand: "Bombay",
    category: "gin",
    description: "Premium London dry gin with 10 botanicals for a complex, balanced flavor.",
    imageUrl: "https://images.unsplash.com/photo-1614313517755-0f5c8f56c7f4",
    buyPrice: 2200,
    sellingPrice: 3200,
    stock: 25,
    lowStockThreshold: 5,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Tanqueray London Dry Gin",
    brand: "Tanqueray",
    category: "gin",
    description: "Classic London dry gin with perfect balance of botanicals.",
    imageUrl: "https://images.unsplash.com/photo-1614313517755-0f5c8f56c7f4",
    buyPrice: 2300,
    sellingPrice: 3400,
    stock: 20,
    lowStockThreshold: 5,
    alcoholPercentage: 47.3,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  
  // Vodka
  {
    name: "Absolut Vodka",
    brand: "Absolut",
    category: "vodka",
    description: "Swedish premium vodka made from winter wheat. Clean, smooth, and crisp.",
    imageUrl: "https://images.unsplash.com/photo-1614313517755-0f5c8f56c7f4",
    buyPrice: 2000,
    sellingPrice: 2800,
    stock: 35,
    lowStockThreshold: 8,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "Smirnoff Red Label",
    brand: "Smirnoff",
    category: "vodka",
    description: "World's best-selling vodka. Triple-distilled and smooth.",
    imageUrl: "https://images.unsplash.com/photo-1614313517755-0f5c8f56c7f4",
    buyPrice: 1500,
    sellingPrice: 2200,
    stock: 50,
    lowStockThreshold: 10,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  
  // Scotch
  {
    name: "Glenfiddich 12 Year",
    brand: "Glenfiddich",
    category: "scotch",
    description: "Single malt Scotch whisky aged 12 years. Notes of pear and oak.",
    imageUrl: "https://images.unsplash.com/photo-1614313517755-0f5c8f56c7f4",
    buyPrice: 4500,
    sellingPrice: 5800,
    stock: 15,
    lowStockThreshold: 3,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  },
  {
    name: "The Macallan 12 Year",
    brand: "Macallan",
    category: "scotch",
    description: "Sherry oak-aged single malt with rich dried fruit and spice notes.",
    imageUrl: "https://images.unsplash.com/photo-1614313517755-0f5c8f56c7f4",
    buyPrice: 6800,
    sellingPrice: 8500,
    stock: 10,
    lowStockThreshold: 2,
    alcoholPercentage: 40,
    volume: 750,
    isAvailable: true,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0
  }
];

// Test Users
const testUsers = [
  {
    email: "customer1@test.com",
    password: "Customer123!",
    name: "John Kamau",
    phone: "+254712345678",
    address: "123 Kenyatta Avenue, Nairobi",
    role: "customer"
  },
  {
    email: "customer2@test.com",
    password: "Customer123!",
    name: "Mary Wanjiku",
    phone: "+254723456789",
    address: "456 Moi Avenue, Nairobi",
    role: "customer"
  }
];

// Admin User
const adminUser = {
  email: "admin@valhala.com",
  password: "Admin123!",
  name: "Valhala Admin",
  phone: "+254700123456",
  role: "admin"
};

// Delivery Settings
const deliverySettings = {
  baseFee: 100,
  feePerKm: 50,
  maxFee: 500,
  freeDeliveryThreshold: 5000,
  estimatedSpeedKmh: 30,
  preparationTimeMinutes: 15,
  distributionCenters: [
    { name: "Valhala Main Depot", lat: -1.2921, lng: 36.8219, address: "CBD, Nairobi", active: true },
    { name: "Westlands Hub", lat: -1.2675, lng: 36.8037, address: "Westlands, Nairobi", active: true },
    { name: "Eastlands Hub", lat: -1.2833, lng: 36.8333, address: "Eastlands, Nairobi", active: true }
  ],
  peakHours: [
    { start: 8, end: 10, multiplier: 1.5 },
    { start: 17, end: 19, multiplier: 1.5 }
  ],
  nightHours: { start: 22, end: 5, multiplier: 1.3 }
};

// Seed the database
async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // 1. Add Products
    console.log('📦 Adding products...');
    for (const product of products) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`   ✅ Added: ${product.name} (${docRef.id})`);
    }
    console.log(`   ✅ Added ${products.length} products\n`);
    
    // 2. Create Test Customer Accounts
    console.log('👤 Creating test customer accounts...');
    for (const user of testUsers) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, user.email, user.password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          role: user.role,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        console.log(`   ✅ Created: ${user.email} (Password: ${user.password})`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`   ⚠️ User already exists: ${user.email}`);
        } else {
          throw error;
        }
      }
    }
    console.log('');
    
    // 3. Create Admin Account
    console.log('👑 Creating admin account...');
    try {
      const adminCred = await createUserWithEmailAndPassword(auth, adminUser.email, adminUser.password);
      await setDoc(doc(db, 'users', adminCred.user.uid), {
        uid: adminCred.user.uid,
        email: adminUser.email,
        name: adminUser.name,
        phone: adminUser.phone,
        role: adminUser.role,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`   ✅ Created: ${adminUser.email} (Password: ${adminUser.password})`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`   ⚠️ Admin already exists: ${adminUser.email}`);
      } else {
        throw error;
      }
    }
    console.log('');
    
    // 4. Setup Delivery Configuration
    console.log('🚚 Setting up delivery configuration...');
    await setDoc(doc(db, 'settings', 'deliveryConfig'), {
      ...deliverySettings,
      updatedAt: Timestamp.now(),
      updatedBy: 'system'
    });
    console.log('   ✅ Delivery configuration saved\n');
    
    // 5. Setup App Settings
    console.log('⚙️ Setting up app settings...');
    await setDoc(doc(db, 'settings', 'appSettings'), {
      appName: 'Valhala',
      version: '1.0.0',
      maintenanceMode: false,
      updatedAt: Timestamp.now()
    });
    console.log('   ✅ App settings saved\n');
    
    // 6. Create Inventory Logs Collection (empty for now)
    console.log('📝 Creating inventory logs collection...');
    await setDoc(doc(db, 'inventory_logs', '_placeholder'), {
      message: 'Collection created',
      createdAt: Timestamp.now()
    });
    console.log('   ✅ Inventory logs ready\n');
    
    // Summary
    console.log('='.repeat(50));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log(`   - Products added: ${products.length}`);
    console.log(`   - Test customers: ${testUsers.length}`);
    console.log(`   - Admin accounts: 1`);
    console.log(`   - Settings configured: Delivery, App`);
    console.log('\n🔐 Test Credentials:');
    console.log(`   Admin: admin@valhala.com / ${adminUser.password}`);
    for (const user of testUsers) {
      console.log(`   Customer: ${user.email} / ${user.password}`);
    }
    console.log('\n✨ Database is ready for use!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();