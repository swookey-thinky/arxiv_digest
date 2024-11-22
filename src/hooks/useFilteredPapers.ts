import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Paper } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useFilteredPapers(papers: Paper[], selectedTag: string | null) {
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>(papers);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedTag) {
      setFilteredPapers(papers);
      return;
    }

    if (!user) {
      setFilteredPapers([]);
      return;
    }

    async function filterPapers() {
      setLoading(true);
      try {
        // Query all papers with this tag for the current user
        const tagsQuery = query(
          collection(db, 'paperTags'),
          where('userId', '==', user.uid),
          where('name', '==', selectedTag)
        );
        
        const snapshot = await getDocs(tagsQuery);
        const taggedPaperIds = new Set(snapshot.docs.map(doc => doc.data().paperId));

        // If we have papers from the date range, prioritize showing those first
        const papersFromDateRange = papers.filter(paper => taggedPaperIds.has(paper.id));
        const otherTaggedPapers: Paper[] = [];

        // For each tagged paper ID that's not in the current date range,
        // fetch its data from ArXiv API
        const missingPaperIds = Array.from(taggedPaperIds)
          .filter(id => !papers.some(p => p.id === id));

        if (missingPaperIds.length > 0) {
          const fetchPromises = missingPaperIds.map(async (id) => {
            try {
              const response = await fetch(
                `https://corsproxy.io/?${encodeURIComponent(
                  `https://export.arxiv.org/api/query?id_list=${id.split('/').pop()}`
                )}`,
                {
                  headers: {
                    'Accept': 'application/xml'
                  }
                }
              );

              if (!response.ok) return null;

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
              console.error('Error fetching paper:', error);
              return null;
            }
          });

          const additionalPapers = (await Promise.all(fetchPromises))
            .filter((paper): paper is Paper => paper !== null);
          
          otherTaggedPapers.push(...additionalPapers);
        }

        // Combine and sort all papers by date
        const allTaggedPapers = [...papersFromDateRange, ...otherTaggedPapers]
          .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

        setFilteredPapers(allTaggedPapers);
      } catch (error) {
        console.error('Error filtering papers by tag:', error);
        setFilteredPapers(papers);
      } finally {
        setLoading(false);
      }
    }

    filterPapers();
  }, [papers, selectedTag, user]);

  return { filteredPapers, loading };
}