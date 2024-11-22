import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2, ChevronDown, Check } from 'lucide-react';
import { usePaperTags } from '../hooks/usePaperTags';
import { useAuth } from '../contexts/AuthContext';

interface PaperTagsProps {
  paperId: string;
}

export function PaperTags({ paperId }: PaperTagsProps) {
  const { user } = useAuth();
  const { tags, allUserTags, addTag, removeTag } = usePaperTags(paperId);
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!user) return null;

  const handleAddTag = async (tagName: string) => {
    if (!tagName.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await addTag(tagName);
      setNewTag('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeTag(tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tag');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag(newTag);
    }
  };

  const existingTags = allUserTags.filter(
    tagName => !tags.some(tag => tag.name === tagName)
  );

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {error && (
        <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full w-full text-center mb-2">
          {error}
        </span>
      )}

      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`${tag.color} text-sm px-2.5 py-0.5 rounded-full flex items-center gap-1 group`}
        >
          {tag.name}
          <button
            onClick={(e) => handleRemoveTag(tag.id, e)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove tag"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
            setError(null);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 py-0.5 px-2 rounded-full hover:bg-gray-100"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          Add tag
          <ChevronDown className="w-3 h-3 ml-0.5" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Create new tag..."
                className="w-full text-sm px-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {existingTags.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-gray-500 bg-gray-50">
                  Existing tags
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {existingTags.map((tagName) => (
                    <button
                      key={tagName}
                      onClick={() => handleAddTag(tagName)}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      {tagName}
                      <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {newTag.trim() && !existingTags.includes(newTag.trim()) && (
              <button
                onClick={() => handleAddTag(newTag)}
                className="w-full text-left px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-between border-t"
              >
                Create "{newTag.trim()}"
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}