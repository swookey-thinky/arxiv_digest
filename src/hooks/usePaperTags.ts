import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface PaperTag {
  id: string;
  paperId: string;
  userId: string;
  name: string;
  color: string;
  createdAt: number;
}

const COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
];

function getColorForTag(tagName: string): string {
  const hash = tagName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function usePaperTags(paperId: string) {
  const [tags, setTags] = useState<PaperTag[]>([]);
  const [allUserTags, setAllUserTags] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAllUserTags([]);
      setTagColors({});
      return;
    }

    const userTagsQuery = query(
      collection(db, 'paperTags'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(userTagsQuery, (snapshot) => {
      const uniqueTags = new Set<string>();
      const colors: Record<string, string> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        uniqueTags.add(data.name);
        if (data.color) {
          colors[data.name] = data.color;
        }
      });

      setAllUserTags(Array.from(uniqueTags).sort());
      setTagColors(colors);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTags([]);
      setLoading(false);
      return;
    }

    const tagsQuery = query(
      collection(db, 'paperTags'),
      where('paperId', '==', paperId),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(tagsQuery, (snapshot) => {
      const newTags = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }) as PaperTag);
      setTags(newTags.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [paperId, user]);

  const addTag = async (name: string) => {
    if (!user) return;

    try {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error('Tag name cannot be empty');

      if (tags.some(tag => tag.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error('Tag already exists for this paper');
      }

      const color = tagColors[trimmedName] || getColorForTag(trimmedName);
      const newTagRef = doc(collection(db, 'paperTags'));

      const tagData: Omit<PaperTag, 'id'> = {
        paperId,
        userId: user.uid,
        name: trimmedName,
        color,
        createdAt: Date.now(),
      };

      await setDoc(newTagRef, tagData);
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error instanceof Error ? error : new Error('Failed to add tag. Please try again.');
    }
  };

  const removeTag = async (tagId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'paperTags', tagId));
    } catch (error) {
      console.error('Error removing tag:', error);
      throw new Error('Failed to remove tag. Please try again.');
    }
  };

  return {
    tags,
    allUserTags,
    loading,
    addTag,
    removeTag,
  };
}