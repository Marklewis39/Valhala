#!/usr/bin/env node

/**
 * Generate Mock Data Script
 * Run: node scripts/generateMockData.js
 * This script generates mock orders, deliveries, and sales data for testing
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  Timestamp,
  doc,
  updateDoc
} = require('firebase/firestore');

// Firebase configuration
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

// Helper function to get random date within range
function getRandomDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return Timestamp.fromDate(date);
}

// Helper function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number between min and max
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Order statuses with weights (higher weight = more likely)
const statuses = [
  { status: 'delivered', weight: 60 },
  { status: 'en_route', weight: 15 },
  { status: 'picked_up', weight: 10 },
  { status: 'awaiting_driver', weight: 10 },
  { status: 'pending_payment', weight: 3 },
  { status: 'cancelled', weight: 2 }
];

// Get weighted random status
function getRandomStatus() {
  const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of statuses) {
    if (random < item.weight) return item.status;
    random -= item.weight;
  }
  return 'delivered';
}

// Get random items from products
async function getRandomItems(products, maxItems = 5) {
  const numItems = getRandomNumber(1, maxItems);
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected = shuffled.slice(0, numItems);
  
  return selected.map(product => ({
    productId: product.id,
    name: product.name,
    quantity: getRandomNumber(1, 3),
    sellingPrice: product.sellingPrice,
    buyPrice: product.buyPrice,
    subtotal: product.sellingPrice * getRandomNumber(1, 3)
  }));
}

// Generate mock orders
async function generateMockOrders() {
  console.log('📊 Generating mock orders...\n');
  
  try {
    // Get all products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (products.length === 0) {
      console.log('❌ No products found. Run seedDatabase.js first!');
      process.exit(1);
    }
    
    // Get all customers
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const customers = usersSnapshot.docs
      .filter(doc => doc.data().role === 'customer')
      .map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (customers.length === 0) {
      console.log('❌ No customers found. Run seedDatabase.js first!');
      process.exit(1);
    }
    
    // Get all drivers
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Generate orders for the last 60 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    const numOrders = 100; // Generate 100 mock orders
    const orders = [];
    const productSales = {};
    
    console.log(`📝 Generating ${numOrders} mock orders...`);
    
    for (let i = 0; i < numOrders; i++) {
      const customer = getRandomItem(customers);
      const items = await getRandomItems(products, 4);
      const subtotal = items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
      const deliveryFee = getRandomNumber(100, 500);
      const total = subtotal + deliveryFee;
      const paidUpfront = total * 0.5;
      const remainingDue = total - paidUpfront;
      const status = getRandomStatus();
      
      // Track product sales
      items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.name,
            unitsSold: 0,
            revenue: 0,
            profit: 0
          };
        }
        productSales[item.productId].unitsSold += item.quantity;
        productSales[item.productId].revenue += item.sellingPrice * item.quantity;
        productSales[item.productId].profit += (item.sellingPrice - item.buyPrice) * item.quantity;
      });
      
      // Assign a random driver for non-pending orders
      let driverId = null;
      let assignedAt = null;
      let pickedUpAt = null;
      let deliveredAt = null;
      
      if (status !== 'pending_payment' && drivers.length > 0) {
        const driver = getRandomItem(drivers);
        driverId = driver.id;
        assignedAt = getRandomDate(startDate, new Date());
        
        if (status === 'picked_up' || status === 'en_route' || status === 'delivered') {
          pickedUpAt = new Date(assignedAt.toDate().getTime() + 15 * 60000);
          pickedUpAt = Timestamp.fromDate(pickedUpAt);
        }
        
        if (status === 'en_route' || status === 'delivered') {
          const enRouteAt = pickedUpAt ? new Date(pickedUpAt.toDate().getTime() + 5 * 60000) : null;
          // Not storing enRouteAt separately, but could be added
        }
        
        if (status === 'delivered') {
          const deliveredDate = pickedUpAt ? new Date(pickedUpAt.toDate().getTime() + 30 * 60000) : new Date();
          deliveredAt = Timestamp.fromDate(deliveredDate);
        }
      }
      
      const order = {
        userId: customer.id,
        userName: customer.name,
        userEmail: customer.email,
        userPhone: customer.phone,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          buyPrice: item.buyPrice,
          subtotal: item.sellingPrice * item.quantity
        })),
        subtotal,
        deliveryFee,
        total,
        paidUpfront,
        remainingDue,
        status,
        paymentStatus: {
          upfront: status === 'pending_payment' ? 'pending' : 'paid',
          remaining: status === 'delivered' ? 'paid_on_delivery' : 'pending'
        },
        deliveryAddress: {
          street: customer.address || '123 Test Street',
          city: 'Nairobi',
          lat: -1.2921 + (Math.random() - 0.5) * 0.1,
          lng: 36.8219 + (Math.random() - 0.5) * 0.1,
          instructions: 'Leave at reception'
        },
        driverId,
        assignedAt: assignedAt || null,
        pickedUpAt: pickedUpAt || null,
        deliveredAt: deliveredAt || null,
        createdAt: getRandomDate(startDate, endDate),
        updatedAt: Timestamp.now()
      };
      
      orders.push(order);
    }
    
    // Add orders to Firestore
    console.log(`💾 Saving ${orders.length} orders to database...`);
    for (const order of orders) {
      await addDoc(collection(db, 'orders'), order);
    }
    
    // Update product sales statistics
    console.log('📈 Updating product sales statistics...');
    for (const [productId, stats] of Object.entries(productSales)) {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        totalSold: stats.unitsSold,
        totalRevenue: stats.revenue,
        totalProfit: stats.profit
      });
      console.log(`   ✅ Updated: ${stats.name} - ${stats.unitsSold} units sold`);
    }
    
    // Generate mock delivery locations for real-time tracking
    console.log('📍 Generating mock driver locations...');
    // This would be handled by the driver app in production
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MOCK DATA GENERATION COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log(`   - Orders generated: ${orders.length}`);
    console.log(`   - Products affected: ${Object.keys(productSales).length}`);
    console.log(`   - Revenue generated: ${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()} KES`);
    console.log(`   - Date range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    
    // Order status breakdown
    const statusBreakdown = {};
    orders.forEach(order => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });
    console.log('\n📊 Order Status Breakdown:');
    for (const [status, count] of Object.entries(statusBreakdown)) {
      console.log(`   - ${status}: ${count} (${((count / orders.length) * 100).toFixed(1)}%)`);
    }
    
    console.log('\n✨ Mock data ready for testing!\n');
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    process.exit(1);
  }
}

// Generate mock issues
async function generateMockIssues() {
  console.log('\n📋 Generating mock customer issues...');
  
  try {
    const issueTypes = [
      { type: 'delivery_failed', label: 'Delivery Failed' },
      { type: 'delayed', label: 'Order Took Too Long' },
      { type: 'price_discrepancy', label: 'Exaggerated Prices' },
      { type: 'wrong_item', label: 'Wrong Item Delivered' },
      { type: 'damaged_item', label: 'Damaged Item' },
      { type: 'other', label: 'Other Issue' }
    ];
    
    const statuses = ['open', 'in_review', 'resolved'];
    
    // Get existing orders
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Generate 20 random issues
    const numIssues = 20;
    const issues = [];
    
    for (let i = 0; i < numIssues; i++) {
      const order = getRandomItem(orders);
      const issueType = getRandomItem(issueTypes);
      const status = getRandomItem(statuses);
      
      const issue = {
        userId: order.userId,
        orderId: order.id,
        type: issueType.type,
        description: `Customer reported: ${issueType.label}. Please investigate.`,
        status: status,
        createdAt: getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
        updatedAt: Timestamp.now()
      };
      
      if (status === 'resolved') {
        issue.resolvedAt = getRandomDate(issue.createdAt.toDate(), new Date());
        issue.adminResponse = 'Thank you for reporting. We have resolved this issue.';
      }
      
      issues.push(issue);
    }
    
    // Add issues to Firestore
    for (const issue of issues) {
      await addDoc(collection(db, 'issues'), issue);
    }
    
    console.log(`   ✅ Generated ${numIssues} mock issues`);
    
  } catch (error) {
    console.error('❌ Error generating mock issues:', error);
  }
}

// Run the generation functions
async function generateAllMockData() {
  console.log('🎲 Mock Data Generator for Valhala\n');
  await generateMockOrders();
  await generateMockIssues();
  process.exit(0);
}

generateAllMockData();