import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from '../services/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Helper function to fetch user data from either users or drivers collection
  const fetchUserData = async (uid) => {
    // First check users collection
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = { id: userDoc.id, ...userDoc.data() };
      setUserRole(data.role || 'customer');
      return data;
    }
    
    // If not in users, check drivers collection
    const driversRef = collection(db, 'drivers');
    const q = query(driversRef, where('userId', '==', uid));
    const driverQuery = await getDocs(q);
    
    if (!driverQuery.empty) {
      const driverData = { id: driverQuery.docs[0].id, ...driverQuery.docs[0].data() };
      // Check if driver is active
      if (driverData.isActive === false) {
        await signOut(auth);
        throw new Error('Your driver account has been deactivated');
      }
      setUserRole('driver');
      return { ...driverData, role: 'driver' };
    }
    
    // Default to customer role with minimal data
    setUserRole('customer');
    return { role: 'customer' };
  };

  useEffect(() => {
    // Record the start time when the component mounts
    const startTime = Date.now();
    
    // Set minimum loading time to match fast van rotation
    // Fast van rotation takes 1.2 seconds per full rotation
    // Setting to 1500ms ensures at least one FULL rotation completes before page loads
    const MINIMUM_LOAD_TIME = 1500; // 1.5 seconds - guarantees at least one full rotation

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const data = await fetchUserData(firebaseUser.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
          if (error.message === 'Your driver account has been deactivated') {
            toast.error('Your driver account has been deactivated. Contact admin.');
          }
          setUserData({ role: 'customer' });
          setUserRole('customer');
        }
      } else {
        setUserData(null);
        setUserRole(null);
      }
      
      // Calculate how much time has elapsed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MINIMUM_LOAD_TIME - elapsedTime;
      
      // Ensure minimum loading time (at least one full rotation of the van)
      if (remainingTime > 0) {
        setTimeout(() => setLoading(false), remainingTime);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password, userType = 'customer') => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // After login, fetch and verify user has correct role
      const data = await fetchUserData(result.user.uid);
      
      // Check if user type matches the intended login page
      if (userType === 'admin' && data.role !== 'admin') {
        await signOut(auth);
        toast.error('Access denied. Admin account required.');
        throw new Error('Not an admin account');
      }
      
      if (userType === 'driver' && data.role !== 'driver') {
        await signOut(auth);
        toast.error('Access denied. Driver account required.');
        throw new Error('Not a driver account');
      }
      
      if (userType === 'customer' && data.role === 'admin') {
        // Admin can also access customer side
        toast.success(`Welcome back, ${data.name || 'Admin'}!`);
      } else if (userType === 'customer' && data.role === 'driver') {
        await signOut(auth);
        toast.error('Please use the driver login portal');
        throw new Error('Driver trying to access customer portal');
      } else {
        toast.success(`Welcome back, ${data.name || 'Customer'}!`);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') message = 'User not found';
      if (error.code === 'auth/wrong-password') message = 'Wrong password';
      if (error.code === 'auth/invalid-email') message = 'Invalid email';
      if (error.code === 'auth/too-many-requests') message = 'Too many failed attempts. Try again later';
      if (error.message === 'Not an admin account') message = 'Admin account required';
      if (error.message === 'Not a driver account') message = 'Driver account required';
      if (error.message === 'Driver trying to access customer portal') message = 'Please use driver login';
      if (error.message === 'Your driver account has been deactivated') message = 'Account deactivated. Contact admin.';
      toast.error(message);
      throw error;
    }
  };

  const register = async (email, password, userDataInput) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Firestore users collection
      await setDoc(doc(db, 'users', result.user.uid), {
        ...userDataInput,
        email,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      toast.success('Account created successfully!');
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
      if (error.code === 'auth/weak-password') message = 'Password is too weak (min 6 characters)';
      if (error.code === 'auth/invalid-email') message = 'Invalid email format';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      let message = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email';
      toast.error(message);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      setUserData(prev => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    userData,
    userRole,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    // Role helper functions
    isAdmin: userRole === 'admin',
    isCustomer: userRole === 'customer',
    isDriver: userRole === 'driver',
    // Explicit role checks
    hasRole: (role) => userRole === role,
    // Authentication state
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};