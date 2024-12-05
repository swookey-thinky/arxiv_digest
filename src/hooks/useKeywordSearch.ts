import { useState, useEffect } from 'react';
import type { Paper } from '../types';

const CORS_PROXY = 'https://corsproxy.io/?';
const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

export function useKeywordSearch(keywords: string[]) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function searchPapers() {
      if (keywords.length === 0) {
        setPapers([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const keywordQuery = keywords
          .map(k => `all:${encodeURIComponent(k)}`)
          .join(' AND ');

        const params = new URLSearchParams({
          search_query: keywordQuery,
          start: '0',
          max_results: '100',
          sortBy: 'submittedDate',
          sortOrder: 'descending'
        });

        const url = `${CORS_PROXY}${encodeURIComponent(`${ARXIV_API_URL}?${params}`)}`;

        const response = await fetch(url, {
          headers: { 'Accept': 'application/xml' },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`ArXiv API error: ${response.status}`);
        }

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
        console.error('Keyword search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search papers');
        setPapers([]);
      } finally {
        setLoading(false);
      }
    }

    searchPapers();

    return () => controller.abort();
  }, [keywords]);

  return { papers, loading, error };
}