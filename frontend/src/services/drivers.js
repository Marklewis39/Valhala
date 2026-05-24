import { 
  db, collection, getDocs, getDoc, doc, query, where, 
  orderBy, updateDoc, addDoc, deleteDoc, onSnapshot, 
  Timestamp, realtimeDb, dbRef, set, get, onValue
} from './firebase';

const COLLECTION = 'drivers';
const LOCATION_PATH = 'driverLocations';

// Get all drivers
export const getDrivers = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting drivers:', error);
    throw error;
  }
};

// Get active drivers
export const getActiveDrivers = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('isActive', '==', true),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting active drivers:', error);
    throw error;
  }
};

// Get available drivers
export const getAvailableDrivers = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('isActive', '==', true),
      where('isAvailable', '==', true),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting available drivers:', error);
    throw error;
  }
};

// Get driver by ID
export const getDriverById = async (driverId) => {
  try {
    const docRef = doc(db, COLLECTION, driverId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting driver:', error);
    throw error;
  }
};

// Add new driver (admin only)
export const addDriver = async (driverData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...driverData,
      isActive: true,
      isAvailable: true,
      totalDeliveries: 0,
      rating: 5.0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...driverData };
  } catch (error) {
    console.error('Error adding driver:', error);
    throw error;
  }
};

// Update driver
export const updateDriver = async (driverId, updateData) => {
  try {
    const driverRef = doc(db, COLLECTION, driverId);
    await updateDoc(driverRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating driver:', error);
    throw error;
  }
};

// Toggle driver status (activate/deactivate)
export const toggleDriverStatus = async (driverId, isActive) => {
  try {
    const driverRef = doc(db, COLLECTION, driverId);
    await updateDoc(driverRef, {
      isActive,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error toggling driver status:', error);
    throw error;
  }
};

// Update driver availability
export const updateDriverAvailability = async (driverId, isAvailable) => {
  try {
    const driverRef = doc(db, COLLECTION, driverId);
    await updateDoc(driverRef, {
      isAvailable,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating driver availability:', error);
    throw error;
  }
};

// Update driver location (realtime database)
export const updateDriverLocation = async (driverId, lat, lng, orderId = null) => {
  try {
    const locationRef = dbRef(realtimeDb, `${LOCATION_PATH}/${driverId}`);
    await set(locationRef, {
      lat,
      lng,
      lastUpdate: Date.now(),
      orderId,
      timestamp: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
};

// Get driver location (realtime)
export const getDriverLocation = (driverId, callback) => {
  const locationRef = dbRef(realtimeDb, `${LOCATION_PATH}/${driverId}`);
  return onValue(locationRef, (snapshot) => {
    const location = snapshot.val();
    callback(location);
  }, (error) => {
    console.error('Error getting driver location:', error);
  });
};

// Get all driver locations (admin)
export const getAllDriverLocations = (callback) => {
  const locationsRef = dbRef(realtimeDb, LOCATION_PATH);
  return onValue(locationsRef, (snapshot) => {
    const locations = snapshot.val();
    callback(locations);
  }, (error) => {
    console.error('Error getting all driver locations:', error);
  });
};

// Increment driver delivery count
export const incrementDriverDeliveries = async (driverId) => {
  try {
    const driverRef = doc(db, COLLECTION, driverId);
    const driver = await getDoc(driverRef);
    const currentCount = driver.data()?.totalDeliveries || 0;
    
    await updateDoc(driverRef, {
      totalDeliveries: currentCount + 1,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error incrementing driver deliveries:', error);
    throw error;
  }
};

// Update driver rating
export const updateDriverRating = async (driverId, newRating) => {
  try {
    const driverRef = doc(db, COLLECTION, driverId);
    const driver = await getDoc(driverRef);
    const currentRating = driver.data()?.rating || 5;
    const ratingCount = driver.data()?.ratingCount || 0;
    const newAverageRating = (currentRating * ratingCount + newRating) / (ratingCount + 1);
    
    await updateDoc(driverRef, {
      rating: newAverageRating,
      ratingCount: ratingCount + 1,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating driver rating:', error);
    throw error;
  }
};

// Delete driver (admin only - soft delete by deactivating)
export const deleteDriver = async (driverId) => {
  try {
    const driverRef = doc(db, COLLECTION, driverId);
    await updateDoc(driverRef, {
      isActive: false,
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }
};

// Get driver statistics
export const getDriverStatistics = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const drivers = snapshot.docs.map(doc => doc.data());
    
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.isActive).length;
    const availableDrivers = drivers.filter(d => d.isActive && d.isAvailable).length;
    const totalDeliveries = drivers.reduce((sum, d) => sum + (d.totalDeliveries || 0), 0);
    const averageRating = drivers.reduce((sum, d) => sum + (d.rating || 5), 0) / totalDrivers;
    
    return {
      totalDrivers,
      activeDrivers,
      availableDrivers,
      totalDeliveries,
      averageRating: averageRating.toFixed(1)
    };
  } catch (error) {
    console.error('Error getting driver statistics:', error);
    throw error;
  }
};

// Real-time driver listener
export const listenToDrivers = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const drivers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(drivers);
  }, (error) => {
    console.error('Error listening to drivers:', error);
  });
};