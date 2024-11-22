import { useState, useEffect } from 'react';
import { collection, query, where, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { SavedQuery } from '../types';

const DEFAULT_QUERY = '(cat:cs.CL OR cat:cs.CV OR cat:cs.AI) AND (abs:"language model" OR abs:"LLM" OR abs:"MLLM" OR abs:"large language model" OR abs:"small language model")';

export function useArxivQueries() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setQueries([]);
      setLoading(false);
      return;
    }

    const queriesRef = query(
      collection(db, 'arxivQueries'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(queriesRef, (snapshot) => {
      const savedQueries = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }) as SavedQuery).sort((a, b) => b.createdAt - a.createdAt);

      setQueries(savedQueries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const saveQuery = async (name: string, queryString: string) => {
    if (!user) return;

    try {
      const newQuery: Omit<SavedQuery, 'id'> = {
        name,
        query: queryString,
        userId: user.uid,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'arxivQueries'), newQuery);
    } catch (error) {
      console.error('Error saving query:', error);
      throw error;
    }
  };

  const deleteQuery = async (queryId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'arxivQueries', queryId));
    } catch (error) {
      console.error('Error deleting query:', error);
      throw error;
    }
  };

  return {
    queries,
    loading,
    saveQuery,
    deleteQuery,
    defaultQuery: DEFAULT_QUERY,
  };
}