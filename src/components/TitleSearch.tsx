import React, { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useTitleSearch } from '../hooks/useTitleSearch';
import { PaperCard } from './PaperCard';
import type { Paper } from '../types';

interface TitleSearchProps {
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId?: string;
}

export function TitleSearch({ onPaperSelect, selectedPaperId }: TitleSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const { papers, loading, error } = useTitleSearch(debouncedSearchTerm);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-medium text-gray-800">Search by Title</h2>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter paper title..."
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-20"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          {searchTerm && !loading && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {debouncedSearchTerm && papers.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            Found {papers.length} papers matching your search
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
      )}

      {debouncedSearchTerm && papers.length === 0 && !loading && (
        <div className="text-center text-gray-600 py-8">
          No papers found matching your search
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Search will begin automatically after you stop typing
      </p>
    </div>
  );
}