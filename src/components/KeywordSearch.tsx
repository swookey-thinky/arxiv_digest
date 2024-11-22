import React, { useState, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useKeywordSearch } from '../hooks/useKeywordSearch';
import { PaperCard } from './PaperCard';
import type { Paper } from '../types';

interface KeywordSearchProps {
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId?: string;
}

export function KeywordSearch({ onPaperSelect, selectedPaperId }: KeywordSearchProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { papers, loading, error } = useKeywordSearch(keywords);

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setInput('');
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input) {
      e.preventDefault();
      addKeyword(input);
    } else if (e.key === 'Backspace' && !input && keywords.length > 0) {
      e.preventDefault();
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-medium text-gray-800">Search by Keywords</h2>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {keyword}
            <button
              onClick={() => removeKeyword(keyword)}
              className="hover:text-blue-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={keywords.length === 0 ? "Enter keywords to search papers..." : ""}
          className="flex-1 min-w-[200px] bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : papers.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            Found {papers.length} papers matching your keywords
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
      ) : keywords.length > 0 ? (
        <div className="text-center text-gray-600 py-8">
          No papers found matching your keywords
        </div>
      ) : null}

      <p className="mt-2 text-xs text-gray-500">
        Press Enter to add a keyword, Backspace to remove the last keyword
      </p>
    </div>
  );
}