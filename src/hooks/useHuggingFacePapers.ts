import { useState, useEffect } from 'react';
import { fetchWithCorsProxy } from '../lib/corsProxy';
import type { Paper } from '../types';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

export function useHuggingFacePapers(date: Date) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPapers() {
      try {
        setLoading(true);
        setError(null);

        const dateStr = date.toISOString().split('T')[0];
        const response = await fetchWithCorsProxy(`https://huggingface.co/papers?date=${dateStr}`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const uniquePaperUrls = new Set<string>();
        const paperLinks = Array.from(doc.querySelectorAll('a[href^="/papers/"]'))
          .map(link => ({
            title: link.textContent?.trim() || '',
            url: `https://huggingface.co${link.getAttribute('href')}`,
            arxivUrl: ''
          }))
          .filter(paper => {
            if (uniquePaperUrls.has(paper.url)) {
              return false;
            }
            uniquePaperUrls.add(paper.url);
            return true;
          });

        const papersWithArxiv = await Promise.all(
          paperLinks.map(async (paper) => {
            const paperResponse = await fetchWithCorsProxy(paper.url);
            const paperHtml = await paperResponse.text();
            const paperDoc = parser.parseFromString(paperHtml, 'text/html');

            const arxivLink = paperDoc.querySelector('a[href^="https://arxiv.org/abs/"]');
            return {
              ...paper,
              arxivUrl: arxivLink?.getAttribute('href') || ''
            };
          })
        );

        const uniqueArxivIds = new Set<string>();
        const formattedPapers = await Promise.all(
          papersWithArxiv
            .filter(paper => {
              const arxivId = paper.arxivUrl.split('/').pop();
              if (!arxivId || uniqueArxivIds.has(arxivId)) {
                return false;
              }
              uniqueArxivIds.add(arxivId);
              return true;
            })
            .map(async (paper) => {
              try {
                const arxivId = paper.arxivUrl.split('/').pop();
                const params = new URLSearchParams({
                  id_list: arxivId || '',
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
                  id: arxivId || '',
                  title: entry.querySelector('title')?.textContent?.replace(/\n/g, ' ').trim() || '',
                  authors: Array.from(entry.querySelectorAll('author name'))
                    .map(name => name.textContent || ''),
                  summary: entry.querySelector('summary')?.textContent?.replace(/\n/g, ' ').trim() || '',
                  published: entry.querySelector('published')?.textContent || '',
                  category: entry.querySelector('category')?.getAttribute('term') || 'Unknown',
                  link: entry.querySelector('link[type="text/html"]')?.getAttribute('href') || paper.arxivUrl
                };
              } catch (error) {
                console.error('Error fetching paper:', error);
                return null;
              }
            })
        );

        setPapers(formattedPapers.filter((p): p is Paper => p !== null));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch papers');
        setLoading(false);
      }
    }

    fetchPapers();
  }, [date]);

  return { papers, loading, error };
}