#!/usr/bin/env node

/**
 * Firestore Backup Script
 * Run: node scripts/backupFirestore.js
 * This script creates a backup of all Firestore collections
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs 
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

// Collections to backup
const collectionsToBackup = [
  'users',
  'products', 
  'orders',
  'drivers',
  'issues',
  'payments',
  'settings',
  'notifications',
  'inventory_logs',
  'admin_logs',
  'order_logs'
];

// Create backup directory
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Helper function to convert Firestore Timestamp to ISO string
function convertTimestamps(obj) {
  if (!obj) return obj;
  
  if (typeof obj === 'object') {
    if (obj.toDate && typeof obj.toDate === 'function') {
      return obj.toDate().toISOString();
    }
    
    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertTimestamps(obj[key]);
      }
    }
    return newObj;
  }
  
  return obj;
}

// Backup a single collection
async function backupCollection(collectionName) {
  console.log(`📦 Backing up collection: ${collectionName}...`);
  
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Timestamps to ISO strings for JSON serialization
      const convertedData = convertTimestamps(data);
      documents.push({
        id: doc.id,
        ...convertedData
      });
    });
    
    // Save to file
    const filename = `${collectionName}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(documents, null, 2));
    console.log(`   ✅ Backed up ${documents.length} documents to ${filename}`);
    
    return { collectionName, count: documents.length, filename };
    
  } catch (error) {
    console.error(`   ❌ Failed to backup ${collectionName}:`, error.message);
    return { collectionName, error: error.message, count: 0 };
  }
}

// Backup all collections
async function backupAllCollections() {
  console.log('🔄 Starting Firestore Backup...\n');
  console.log(`📁 Backup directory: ${backupDir}\n`);
  
  const startTime = Date.now();
  const results = [];
  
  for (const collectionName of collectionsToBackup) {
    const result = await backupCollection(collectionName);
    results.push(result);
  }
  
  // Create backup summary
  const summary = {
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    collections: results
  };
  
  const summaryFile = path.join(backupDir, `backup_summary_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 BACKUP COMPLETE!');
  console.log('='.repeat(50));
  console.log(`\n📋 Backup Summary:`);
  console.log(`   - Time: ${new Date().toLocaleString()}`);
  console.log(`   - Duration: ${summary.duration_ms}ms`);
  console.log(`   - Collections backed up: ${results.filter(r => !r.error).length}/${collectionsToBackup.length}`);
  
  const totalDocs = results.reduce((sum, r) => sum + (r.count || 0), 0);
  console.log(`   - Total documents: ${totalDocs}`);
  
  console.log('\n❌ Failed collections:');
  results.filter(r => r.error).forEach(r => {
    console.log(`   - ${r.collectionName}: ${r.error}`);
  });
  
  console.log(`\n📁 Backup saved to: ${backupDir}`);
  console.log(`📄 Summary file: ${summaryFile}\n`);
}

// Restore from backup (optional feature)
async function restoreFromBackup(backupFile, collectionName) {
  console.log(`🔄 Restoring ${collectionName} from ${backupFile}...`);
  
  try {
    const filepath = path.join(backupDir, backupFile);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const { db: firestoreDB } = require('firebase/firestore');
    
    for (const doc of data) {
      const { id, ...docData } = doc;
      const docRef = firestoreDB.collection(collectionName).doc(id);
      await docRef.set(docData);
    }
    
    console.log(`   ✅ Restored ${data.length} documents to ${collectionName}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to restore:`, error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'restore') {
  const backupFile = args[1];
  const collectionName = args[2];
  if (!backupFile || !collectionName) {
    console.log('Usage: node backupFirestore.js restore <backup_file> <collection_name>');
    process.exit(1);
  }
  restoreFromBackup(backupFile, collectionName);
} else {
  // Default: run backup
  backupAllCollections().then(() => process.exit(0)).catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
}