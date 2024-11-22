import React, { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useArxivPapers } from './hooks/useArxivPapers';
import { useFilteredPapers } from './hooks/useFilteredPapers';
import { useArxivQueries } from './hooks/useArxivQueries';
import { PaperCard } from './components/PaperCard';
import { AuthProvider } from './contexts/AuthContext';
import { UserMenu } from './components/UserMenu';
import { LoginButton } from './components/LoginButton';
import { TagFilter } from './components/TagFilter';
import { DatePicker } from './components/DatePicker';
import { QueryPicker } from './components/QueryPicker';
import { PaperSidebar } from './components/PaperSidebar';
import { useAuth } from './contexts/AuthContext';
import type { Paper } from './types';

function Dashboard() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const defaultStart = new Date(today);
  defaultStart.setUTCDate(today.getUTCDate() - 1);

  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(today);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const { defaultQuery } = useArxivQueries();
  const [currentQuery, setCurrentQuery] = useState(defaultQuery);
  
  const { papers, loading: papersLoading, error } = useArxivPapers(startDate, endDate, currentQuery);
  const { filteredPapers, loading: filterLoading } = useFilteredPapers(papers, selectedTag);
  const { user } = useAuth();

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">ArXiv AI Papers</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Sign in to access the latest Research Papers
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <BookOpen className="w-12 h-12 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">ArXiv AI Papers</h1>
              <p className="text-xl text-gray-600">
                Latest Research Papers from Arxiv
              </p>
            </div>
          </div>
          <UserMenu />
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64">
            <TagFilter selectedTag={selectedTag} onTagSelect={setSelectedTag} />
          </div>

          <div className="flex-1">
            {!selectedTag && (
              <>
                <DatePicker 
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={handleDateRangeChange}
                />
                <QueryPicker
                  currentQuery={currentQuery}
                  onQueryChange={setCurrentQuery}
                />
              </>
            )}

            {(papersLoading || filterLoading) && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}

            {error && (
              <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-6">
                <p className="font-semibold">Error loading papers</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!papersLoading && !filterLoading && !error && (
              <div className="mb-6 text-center">
                <div className="inline-block bg-white px-4 py-2 rounded-full shadow-sm">
                  <span className="font-medium text-gray-700">
                    {filteredPapers.length === 0 ? 'No papers found' : `${filteredPapers.length} paper${filteredPapers.length === 1 ? '' : 's'} found`}
                  </span>
                  {selectedTag ? (
                    <span className="text-gray-500 ml-1">tagged with "{selectedTag}"</span>
                  ) : (
                    <span className="text-gray-500 ml-1">
                      from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPapers.map((paper) => (
                <PaperCard 
                  key={paper.id} 
                  paper={paper} 
                  onSelect={() => setSelectedPaper(paper)}
                  isSelected={selectedPaper?.id === paper.id}
                />
              ))}
            </div>

            {!papersLoading && !filterLoading && filteredPapers.length === 0 && !error && (
              <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow">
                <p className="text-lg font-medium">
                  {selectedTag 
                    ? `No papers found with tag "${selectedTag}"`
                    : 'No papers found for selected date range'}
                </p>
                <p className="mt-2">
                  {selectedTag 
                    ? 'Try selecting a different tag or view all papers'
                    : 'Try selecting a different date range'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaperSidebar 
        paper={selectedPaper} 
        onClose={() => setSelectedPaper(null)} 
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

export default App;