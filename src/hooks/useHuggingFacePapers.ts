import { useState, useEffect } from 'react';
import { fetchWithCorsProxy } from '../lib/corsProxy';
import type { Paper } from '../types';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, options?: RequestInit, retries = MAX_RETRIES, delay = INITIAL_DELAY): Promise<Response> {
  try {
    const response = await fetchWithCorsProxy(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying fetch (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}) after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

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
        const response = await fetchWithRetry(`https://huggingface.co/papers?date=${dateStr}`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const uniqueArxivIds = new Set<string>();
        const paperLinks = Array.from(doc.querySelectorAll('a[href^="/papers/"]'))
          .map(link => {
            const href = link.getAttribute('href') || '';
            const arxivId = href.split('/').pop()?.split('#')[0] || '';
            return {
              title: link.textContent?.trim() || '',
              arxivId,
              arxivUrl: `https://arxiv.org/abs/${arxivId}`
            };
          })
          .filter(paper => {
            if (!paper.arxivId || uniqueArxivIds.has(paper.arxivId)) {
              return false;
            }
            uniqueArxivIds.add(paper.arxivId);
            return true;
          });

        const formattedPapers = await Promise.all(
          paperLinks.map(async (paper) => {
            try {
              const params = new URLSearchParams({
                id_list: paper.arxivId,
              });

              const arxivUrl = `${ARXIV_API_URL}?${params}`;
              const response = await fetchWithRetry(arxivUrl, {
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
                id: paper.arxivId,
                title: entry.querySelector('title')?.textContent?.replace(/\n/g, ' ').trim() || '',
                authors: Array.from(entry.querySelectorAll('author name'))
                  .map(name => name.textContent || ''),
                summary: entry.querySelector('summary')?.textContent?.replace(/\n/g, ' ').trim() || '',
                published: entry.querySelector('published')?.textContent || '',
                category: entry.querySelector('category')?.getAttribute('term') || 'Unknown',
                link: paper.arxivUrl
              };
            } catch (error) {
              console.error('Error fetching paper:', error);
              return null;
            }
          })
        );

        setPapers(formattedPapers.filter((paper): paper is Paper => paper !== null));
      } catch (error) {
        console.error('Error fetching papers:', error);
        setError('Failed to fetch papers. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPapers();
  }, [date]);

  return { papers, loading, error };
}