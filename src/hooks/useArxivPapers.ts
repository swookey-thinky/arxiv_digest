import { useState, useEffect } from 'react';
import type { Paper } from '../types';
import { fetchWithCorsProxy } from '../lib/corsProxy';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

function parseArxivXML(xmlString: string, startDate: Date, endDate: Date): Paper[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse ArXiv API response');
  }
  
  const entries = xmlDoc.getElementsByTagName('entry');
  const papers: Paper[] = [];

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      const id = entry.getElementsByTagName('id')[0]?.textContent;
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
      let link = id;
      for (let j = 0; j < links.length; j++) {
        if (links[j].getAttribute('type') === 'text/html') {
          link = links[j].getAttribute('href') || id;
          break;
        }
      }

      const publishedDate = new Date(published);
      publishedDate.setUTCHours(0, 0, 0, 0);
      
      if (publishedDate >= start && publishedDate <= end) {
        papers.push({
          id,
          title,
          authors,
          summary,
          link,
          published: publishedDate.toISOString(),
          category
        });
      }
    } catch (e) {
      console.error('Error parsing entry:', e);
      continue;
    }
  }

  return papers;
}

export function useArxivPapers(startDate: Date, endDate: Date, query: string) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError(null);

        const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
        const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

        const searchQuery = `${query} AND submittedDate:[${startStr}0000 TO ${endStr}2359]`;
        
        const params = new URLSearchParams({
          search_query: searchQuery,
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
        
        const xmlData = await response.text();

        if (!xmlData || xmlData.trim() === '') {
          throw new Error('Empty response from arXiv API');
        }

        if (xmlData.includes('<error>')) {
          const errorMatch = xmlData.match(/<error>(.*?)<\/error>/);
          throw new Error(errorMatch ? errorMatch[1] : 'ArXiv API error');
        }

        const parsedPapers = parseArxivXML(xmlData, startDate, endDate);
        setPapers(parsedPapers);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('ArXiv API Error:', err);
        setError(
          err instanceof Error 
            ? `Failed to fetch papers: ${err.message}` 
            : 'Failed to fetch papers from arXiv'
        );
        setPapers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPapers, 100);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [startDate, endDate, query]);

  return { papers, loading, error };
}