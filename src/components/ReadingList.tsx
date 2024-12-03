import React, { useState, useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PaperCard } from './PaperCard';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithCorsProxy } from '../lib/corsProxy';
import type { Paper } from '../types';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

interface ReadingListProps {
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId?: string;
}

export function ReadingList({ onPaperSelect, selectedPaperId }: ReadingListProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPapers([]);
      setLoading(false);
      return;
    }

    async function fetchReadingList() {
      try {
        // Query for papers with "Reading List" tag
        const tagsQuery = query(
          collection(db, 'paperTags'),
          where('userId', '==', user.uid),
          where('name', '==', 'Reading List')
        );

        const snapshot = await getDocs(tagsQuery);
        const paperIds = snapshot.docs.map(doc => doc.data().paperId);

        if (paperIds.length === 0) {
          setPapers([]);
          setLoading(false);
          return;
        }

        // Fetch paper details from ArXiv
        const papersData = await Promise.all(
          paperIds.map(async (id) => {
            try {
              const params = new URLSearchParams({
                id_list: id.split('/').pop() || '',
              });

              const arxivUrl = `${ARXIV_API_URL}?${params}`;
              const response = await fetchWithCorsProxy(arxivUrl, {
                headers: {
                  'Accept': 'application/xml'
                }
              });

              const xmlText = await response.text();
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
              const entry = xmlDoc.querySelector('entry');

              if (!entry) return null;

              return {
                id,
                title: entry.querySelector('title')?.textContent?.replace(/\n/g, ' ').trim() || '',
                authors: Array.from(entry.querySelectorAll('author name'))
                  .map(name => name.textContent || ''),
                summary: entry.querySelector('summary')?.textContent?.replace(/\n/g, ' ').trim() || '',
                published: entry.querySelector('published')?.textContent || '',
                category: entry.querySelector('category')?.getAttribute('term') || 'Unknown',
                link: entry.querySelector('link[type="text/html"]')?.getAttribute('href') || id
              };
            } catch (error) {
              console.error('Error fetching paper:', error);
              return null;
            }
          })
        );

        const validPapers = papersData.filter((p): p is Paper => p !== null);
        validPapers.sort((a, b) =>
          new Date(b.published).getTime() - new Date(a.published).getTime()
        );

        setPapers(validPapers);
      } catch (error) {
        console.error('Error fetching reading list:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReadingList();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow">
        <p className="text-lg font-medium">Your reading list is empty</p>
        <p className="mt-2">Add papers by using the "Reading List" tag</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-block bg-white px-4 py-2 rounded-full shadow-sm">
          <span className="font-medium text-gray-700">
            {papers.length} paper{papers.length === 1 ? '' : 's'} in your reading list
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {papers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSelect={() => onPaperSelect(paper)}
            isSelected={paper.id === selectedPaperId}
          />
        ))}
      </div>
    </div>
  );
}