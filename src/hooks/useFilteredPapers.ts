import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Paper } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithCorsProxy } from '../lib/corsProxy';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

export function useFilteredPapers(papers: Paper[], selectedTag: string | null) {
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>(papers);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedTag) {
      setFilteredPapers(papers);
      setLoading(false);
      return;
    }

    if (!user) {
      setFilteredPapers([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function filterPapers() {
      setLoading(true);
      try {
        const tagsQuery = query(
          collection(db, 'paperTags'),
          where('userId', '==', user.uid),
          where('name', '==', selectedTag)
        );
        
        const snapshot = await getDocs(tagsQuery);
        const taggedPaperIds = new Set(snapshot.docs.map(doc => doc.data().paperId));

        const papersWithTag = papers.filter(paper => taggedPaperIds.has(paper.id));
        
        const missingPaperIds = Array.from(taggedPaperIds)
          .filter(id => !papers.some(p => p.id === id));

        const additionalPapers = await Promise.all(
          missingPaperIds.map(async (id) => {
            try {
              const params = new URLSearchParams({
                id_list: id.split('/').pop() || '',
              });

              const arxivUrl = `${ARXIV_API_URL}?${params}`;
              
              const response = await fetchWithCorsProxy(arxivUrl, {
                headers: {
                  'Accept': 'application/xml'
                },
                signal: controller.signal
              });

              const xmlText = await response.text();
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
              const entry = xmlDoc.querySelector('entry');

              if (!entry) return null;

              const paper: Paper = {
                id,
                title: entry.querySelector('title')?.textContent?.replace(/\n/g, ' ').trim() || '',
                authors: Array.from(entry.querySelectorAll('author name'))
                  .map(name => name.textContent || ''),
                summary: entry.querySelector('summary')?.textContent?.replace(/\n/g, ' ').trim() || '',
                published: entry.querySelector('published')?.textContent || '',
                category: entry.querySelector('category')?.getAttribute('term') || 'Unknown',
                link: entry.querySelector('link[type="text/html"]')?.getAttribute('href') || id
              };

              return paper;
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                throw error;
              }
              console.error('Error fetching paper:', error);
              return null;
            }
          })
        );

        const allPapers = [
          ...papersWithTag,
          ...additionalPapers.filter((p): p is Paper => p !== null)
        ];

        allPapers.sort((a, b) => 
          new Date(b.published).getTime() - new Date(a.published).getTime()
        );

        setFilteredPapers(allPapers);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error filtering papers by tag:', error);
        setFilteredPapers(papers);
      } finally {
        setLoading(false);
      }
    }

    filterPapers();

    return () => controller.abort();
  }, [papers, selectedTag, user]);

  return { filteredPapers, loading };
}