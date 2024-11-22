import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Save, Loader2 } from 'lucide-react';
import { useArxivQueries } from '../hooks/useArxivQueries';
import { useAuth } from '../contexts/AuthContext';

interface QueryPickerProps {
  currentQuery: string;
  onQueryChange: (query: string) => void;
}

export function QueryPicker({ currentQuery, onQueryChange }: QueryPickerProps) {
  const { user } = useAuth();
  const { queries, loading, saveQuery, deleteQuery, defaultQuery } = useArxivQueries();
  const [isEditing, setIsEditing] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [editedQuery, setEditedQuery] = useState(currentQuery);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editedQuery]);

  const handleSave = async () => {
    if (!editedQuery.trim() || isSaving) return;

    setError(null);
    setIsSaving(true);

    try {
      await saveQuery(newQueryName.trim() || 'Untitled Query', editedQuery.trim());
      setNewQueryName('');
      setIsEditing(false);
      onQueryChange(editedQuery.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save query');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (queryId: string) => {
    try {
      await deleteQuery(queryId);
      if (queries.find(q => q.id === queryId)?.query === currentQuery) {
        onQueryChange(defaultQuery);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete query');
    }
  };

  if (!user) return null;

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-800">ArXiv Search Query</h2>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              New Query
            </button>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={newQueryName}
              onChange={(e) => setNewQueryName(e.target.value)}
              placeholder="Query name (optional)"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              ref={textareaRef}
              value={editedQuery}
              onChange={(e) => setEditedQuery(e.target.value)}
              placeholder="Enter ArXiv search query..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
              rows={1}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewQueryName('');
                  setEditedQuery(currentQuery);
                  setError(null);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editedQuery.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Query
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => onQueryChange(defaultQuery)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    currentQuery === defaultQuery
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Language Modeling
                </button>
                {queries.map((q) => (
                  <div
                    key={q.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg ${
                      currentQuery === q.query
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => onQueryChange(q.query)}
                      className="flex-1 text-left text-sm"
                    >
                      {q.name}
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                      aria-label="Delete query"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}