import React from 'react';
import { X, ExternalLink, BookOpen, Users, Tag } from 'lucide-react';
import type { Paper } from '../types';
import { PaperTags } from './PaperTags';

interface PaperSidebarProps {
  paper: Paper | null;
  onClose: () => void;
}

export function PaperSidebar({ paper, onClose }: PaperSidebarProps) {
  if (!paper) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-200 ease-in-out z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white z-10 p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <a
            href={paper.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm">View on arXiv</span>
          </a>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{paper.title}</h2>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{new Date(paper.published).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="w-4 h-4" />
            <span>{paper.category}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <h3 className="font-medium">Authors</h3>
          </div>
          <p className="text-sm text-gray-800">{paper.authors.join(', ')}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">Abstract</h3>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
            {paper.summary}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">Tags</h3>
          <div className="paper-tags">
            <PaperTags paperId={paper.id} />
          </div>
        </div>
      </div>
    </div>
  );
}