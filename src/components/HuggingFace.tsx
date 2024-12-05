import React, { useState } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import { PaperCard } from './PaperCard';
import { useHuggingFacePapers } from '../hooks/useHuggingFacePapers';
import { SingleDatePicker } from './SingleDatePicker';
import type { Paper } from '../types';

export function HuggingFace() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { papers, loading, error } = useHuggingFacePapers(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
          Hugging Face Daily Papers
        </h1>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Calendar className="w-5 h-5 text-blue-600" />
            <SingleDatePicker
              selectedDate={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-6">
            <p className="font-semibold">Error loading papers</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && papers.length === 0 && (
          <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow">
            <p className="text-lg font-medium">No papers found</p>
            <p className="mt-2">Check back later for new papers</p>
          </div>
        )}

        {!loading && !error && papers.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="font-medium text-gray-700">
                  {papers.length} paper{papers.length === 1 ? '' : 's'} from Hugging Face
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onSelect={() => {}}
                  isSelected={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}