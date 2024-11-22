import React from 'react';
import { Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaperTags } from '../hooks/usePaperTags';

interface TagFilterProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export function TagFilter({ selectedTag, onTagSelect }: TagFilterProps) {
  const { user } = useAuth();
  const { allUserTags } = usePaperTags('');

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Tag className="w-5 h-5" />
        Search by Tag
      </h2>
      <div className="space-y-1 max-h-[280px] md:max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {allUserTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedTag === tag
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tag}
          </button>
        ))}
        {allUserTags.length === 0 && (
          <p className="text-sm text-gray-500 px-3 py-2">
            No tags created yet
          </p>
        )}
      </div>
    </div>
  );
}