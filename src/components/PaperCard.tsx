import React, { useState } from 'react';
import { BookOpen, ExternalLink, Tag, Users, Bookmark, BookmarkIcon } from 'lucide-react';
import { PaperTags } from './PaperTags';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { usePaperTags } from '../hooks/usePaperTags';
import type { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  onSelect: () => void;
  isSelected: boolean;
}

export function PaperCard({ paper, onSelect, isSelected }: PaperCardProps) {
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { allUserTags, tagColors } = usePaperTags(paper.id);

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toUTCString().split(' ').slice(1, 4).join(' ');
  };

  React.useEffect(() => {
    async function checkReadingList() {
      if (!user) {
        setIsInReadingList(false);
        setIsLoading(false);
        return;
      }

      try {
        const tagsQuery = query(
          collection(db, 'paperTags'),
          where('userId', '==', user.uid),
          where('paperId', '==', paper.id),
          where('name', '==', 'Reading List')
        );
        const snapshot = await getDocs(tagsQuery);
        setIsInReadingList(!snapshot.empty);
      } catch (error) {
        console.error('Error checking reading list:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkReadingList();
  }, [user, paper.id]);

  const toggleReadingList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    setIsLoading(true);
    try {
      const tagsQuery = query(
        collection(db, 'paperTags'),
        where('userId', '==', user.uid),
        where('paperId', '==', paper.id),
        where('name', '==', 'Reading List')
      );
      const snapshot = await getDocs(tagsQuery);

      if (snapshot.empty) {
        const allReadingListQuery = query(
          collection(db, 'paperTags'),
          where('userId', '==', user.uid),
          where('name', '==', 'Reading List')
        );
        const allReadingListSnapshot = await getDocs(allReadingListQuery);
        const existingColor = allReadingListSnapshot.docs[0]?.data()?.color || 'bg-blue-100 text-blue-800';

        await addDoc(collection(db, 'paperTags'), {
          userId: user.uid,
          paperId: paper.id,
          name: 'Reading List',
          color: existingColor,
          createdAt: Date.now()
        });
        setIsInReadingList(true);
      } else {
        await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
        setIsInReadingList(false);
      }
    } catch (error) {
      console.error('Error toggling reading list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.external-link-btn, .paper-tags, .reading-list-btn')) {
      return;
    }
    onSelect();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer group relative ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-800 flex-1 group-hover:text-blue-600 transition-colors">
          {paper.title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleReadingList}
            disabled={isLoading || !user}
            className={`reading-list-btn p-1.5 rounded-full transition-colors ${
              isInReadingList
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isInReadingList ? 'Remove from Reading List' : 'Add to Reading List'}
          >
            {isInReadingList ? (
              <BookmarkIcon className="w-5 h-5 fill-current" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
          <a
            href={paper.link}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-btn p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{formatPublishedDate(paper.published)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tag className="w-4 h-4" />
          <span>{paper.category}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <p className="truncate">{paper.authors.join(', ')}</p>
      </div>

      <p className="mt-4 text-gray-600 line-clamp-3 group-hover:text-gray-700">
        {paper.summary}
      </p>

      <div className="paper-tags">
        <PaperTags paperId={paper.id} />
      </div>

      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-100 pointer-events-none transition-colors" />
    </div>
  );
}