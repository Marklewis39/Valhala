import { 
  db, collection, addDoc, getDocs, getDoc, doc, query, 
  where, orderBy, updateDoc, onSnapshot, Timestamp,
  limit
} from './firebase';

const COLLECTION = 'issues';

// Create new issue
export const createIssue = async (issueData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...issueData,
      status: 'open',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...issueData };
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
};

// Get issue by ID
export const getIssueById = async (issueId) => {
  try {
    const docRef = doc(db, COLLECTION, issueId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting issue:', error);
    throw error;
  }
};

// Get user issues
export const getUserIssues = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user issues:', error);
    throw error;
  }
};

// Get issues by order
export const getIssuesByOrder = async (orderId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting issues by order:', error);
    throw error;
  }
};

// Get all issues (admin only)
export const getAllIssues = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all issues:', error);
    throw error;
  }
};

// Get open issues
export const getOpenIssues = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting open issues:', error);
    throw error;
  }
};

// Update issue status
export const updateIssueStatus = async (issueId, status) => {
  try {
    const issueRef = doc(db, COLLECTION, issueId);
    await updateDoc(issueRef, {
      status,
      updatedAt: Timestamp.now(),
      ...(status === 'resolved' && { resolvedAt: Timestamp.now() })
    });
    return true;
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
};

// Respond to issue (admin)
export const respondToIssue = async (issueId, response, status = 'in_review') => {
  try {
    const issueRef = doc(db, COLLECTION, issueId);
    await updateDoc(issueRef, {
      adminResponse: response,
      status,
      respondedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error responding to issue:', error);
    throw error;
  }
};

// Resolve issue
export const resolveIssue = async (issueId, resolution = null) => {
  try {
    const issueRef = doc(db, COLLECTION, issueId);
    await updateDoc(issueRef, {
      status: 'resolved',
      resolution,
      resolvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error resolving issue:', error);
    throw error;
  }
};

// Get issue statistics
export const getIssueStatistics = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const issues = snapshot.docs.map(doc => doc.data());
    
    const totalIssues = issues.length;
    const openIssues = issues.filter(i => i.status === 'open').length;
    const inReviewIssues = issues.filter(i => i.status === 'in_review').length;
    const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
    
    // Group by type
    const byType = {};
    issues.forEach(issue => {
      const type = issue.type || 'other';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    return {
      totalIssues,
      openIssues,
      inReviewIssues,
      resolvedIssues,
      byType
    };
  } catch (error) {
    console.error('Error getting issue statistics:', error);
    throw error;
  }
};

// Real-time issue listener
export const listenToIssues = (callback, filters = {}) => {
  let constraints = [orderBy('createdAt', 'desc')];
  
  if (filters.status) {
    constraints.unshift(where('status', '==', filters.status));
  }
  
  if (filters.userId) {
    constraints.unshift(where('userId', '==', filters.userId));
  }
  
  const q = query(collection(db, COLLECTION), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(issues);
  }, (error) => {
    console.error('Error listening to issues:', error);
  });
};