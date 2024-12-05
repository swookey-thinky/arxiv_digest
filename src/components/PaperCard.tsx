import React from 'react';
import { ExternalLink, BookOpen, Users, Tag } from 'lucide-react';
import type { Paper } from '../types';
import { PaperTags } from './PaperTags';

interface PaperCardProps {
  paper: Paper;
  onSelect: () => void;
  isSelected: boolean;
}

export function PaperCard({ paper, onSelect, isSelected }: PaperCardProps) {
  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toUTCString().split(' ').slice(1, 4).join(' ');
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the external link button or within tags
    if ((e.target as HTMLElement).closest('.external-link-btn, .paper-tags')) {
      return;
    }
    onSelect();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer group relative ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex-1 group-hover:text-blue-600 transition-colors">
          {paper.title}
        </h2>
        <a
          href={paper.link}
          target="_blank"
          rel="noopener noreferrer"
          className="external-link-btn ml-4 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{formatPublishedDate(paper.published)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tag className="w-4 h-4" />
          <span>{paper.category}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <p className="truncate">{paper.authors.join(', ')}</p>
      </div>

      <p className="mt-4 text-gray-600 line-clamp-3 group-hover:text-gray-700">
        {paper.summary}
      </p>

      <div className="paper-tags">
        <PaperTags paperId={paper.id} />
      </div>

      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-100 pointer-events-none transition-colors" />
    </div>
  );
}