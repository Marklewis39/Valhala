import { useState, useEffect } from 'react';
import { db, collection, query, where, getDocs, onSnapshot } from '../services/firebase';

export const useFirestore = (collectionName, conditions = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    let q = collection(db, collectionName);
    
    if (conditions.length > 0) {
      const constraints = conditions.map(condition => 
        where(condition.field, condition.operator, condition.value)
      );
      q = query(q, ...constraints);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(results);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Firestore error:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(conditions)]);

  return { data, loading, error };
};