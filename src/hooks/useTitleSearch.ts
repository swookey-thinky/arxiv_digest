import { useState, useEffect } from 'react';
import type { Paper } from '../types';
import { fetchWithCorsProxy } from '../lib/corsProxy';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

export function useTitleSearch(searchTerm: string) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function searchPapers() {
      if (!searchTerm.trim()) {
        setPapers([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search_query: `ti:"${encodeURIComponent(searchTerm.trim())}"`,
          start: '0',
          max_results: '1000',
          sortBy: 'submittedDate',
          sortOrder: 'descending'
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

        const entries = xmlDoc.getElementsByTagName('entry');
        const searchResults: Paper[] = [];

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          try {
            const idUrl = entry.getElementsByTagName('id')[0]?.textContent;
            if (!idUrl) continue;

            const rawId = idUrl.split('/').pop() || '';
            const id = rawId.replace(/v\d+$/, '');
            if (!id) continue;

            const title = entry.getElementsByTagName('title')[0]?.textContent?.replace(/\n/g, ' ').trim();
            if (!title) continue;

            const summary = entry.getElementsByTagName('summary')[0]?.textContent?.replace(/\n/g, ' ').trim() || '';
            const published = entry.getElementsByTagName('published')[0]?.textContent;
            if (!published) continue;

            const category = entry.getElementsByTagName('category')[0]?.getAttribute('term') || 'Unknown';

            const authorNodes = entry.getElementsByTagName('author');
            const authors: string[] = [];
            for (let j = 0; j < authorNodes.length; j++) {
              const name = authorNodes[j].getElementsByTagName('name')[0]?.textContent;
              if (name) authors.push(name);
            }

            const links = entry.getElementsByTagName('link');
            let link = `https://arxiv.org/abs/${id}`;
            for (let j = 0; j < links.length; j++) {
              if (links[j].getAttribute('type') === 'text/html') {
                link = links[j].getAttribute('href') || link;
                break;
              }
            }

            searchResults.push({
              id,
              title,
              authors,
              summary,
              link,
              published,
              category
            });
          } catch (e) {
            console.error('Error parsing entry:', e);
            continue;
          }
        }

        setPapers(searchResults);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Title search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search papers');
        setPapers([]);
      } finally {
        setLoading(false);
      }
    }

    searchPapers();

    return () => controller.abort();
  }, [searchTerm]);

  return { papers, loading, error };
}