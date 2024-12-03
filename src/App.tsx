import React, { useState } from 'react';
import { BookOpen, Loader2, List } from 'lucide-react';
import { useArxivPapers } from './hooks/useArxivPapers';
import { PaperCard } from './components/PaperCard';
import { AuthProvider } from './contexts/AuthContext';
import { UserMenu } from './components/UserMenu';
import { LoginButton } from './components/LoginButton';
import { DatePicker } from './components/DatePicker';
import { QueryPicker } from './components/QueryPicker';
import { TagFilter } from './components/TagFilter';
import { PaperSidebar } from './components/PaperSidebar';
import { KeywordSearch } from './components/KeywordSearch';
import { TitleSearch } from './components/TitleSearch';
import { useArxivQueries } from './hooks/useArxivQueries';
import { useAuth } from './contexts/AuthContext';
import { useFilteredPapers } from './hooks/useFilteredPapers';
import { ReadingList } from './components/ReadingList';
import type { Paper } from './types';

type Tab = 'papers' | 'reading-list';

function Dashboard() {
  const { user } = useAuth();
  const { defaultQuery } = useArxivQueries();
  const [currentQuery, setCurrentQuery] = useState(defaultQuery);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('papers');

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setUTCHours(23, 59, 59, 999);
    return date;
  });

  const { papers, loading: papersLoading, error: papersError } = useArxivPapers(startDate, endDate, currentQuery);
  const { filteredPapers, loading: filterLoading } = useFilteredPapers(papers, selectedTag);

  const loading = papersLoading || filterLoading;
  const error = papersError;

  const handleQueryChange = (query: string) => {
    setCurrentQuery(query);
    setSelectedTag(null); // Clear tag selection when query changes
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentQuery(null); // Reset to default query when tag is selected
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
            Sign in to access the latest research papers from ArXiv
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
                Track and Triage the Latest Research Papers on ArXiv
              </p>
            </div>
          </div>
          <UserMenu />
        </header>

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setCurrentTab('papers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'papers'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Papers
          </button>
          <button
            onClick={() => setCurrentTab('reading-list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentTab === 'reading-list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <List className="w-5 h-5" />
            Reading List
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {currentTab === 'papers' && (
            <div className="lg:col-span-1 space-y-6">
              <TagFilter
                selectedTag={selectedTag}
                onTagSelect={handleTagSelect}
              />
              <QueryPicker
                currentQuery={currentQuery}
                onQueryChange={handleQueryChange}
              />
              <TitleSearch
                onPaperSelect={setSelectedPaper}
                selectedPaperId={selectedPaper?.id}
              />
              <KeywordSearch
                onPaperSelect={setSelectedPaper}
                selectedPaperId={selectedPaper?.id}
              />
            </div>
          )}

          <div className={currentTab === 'papers' ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {currentTab === 'papers' ? (
              <>
                <DatePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />

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

                {!loading && !error && (
                  <div className="mb-6 text-center">
                    <div className="inline-block bg-white px-4 py-2 rounded-full shadow-sm">
                      <span className="font-medium text-gray-700">
                        {filteredPapers.length === 0 ? 'No papers found' : `${filteredPapers.length} paper${filteredPapers.length === 1 ? '' : 's'} found`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  {filteredPapers.map((paper) => (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
                      onSelect={() => setSelectedPaper(paper)}
                      isSelected={selectedPaper?.id === paper.id}
                    />
                  ))}
                </div>

                {!loading && filteredPapers.length === 0 && !error && (
                  <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow">
                    <p className="text-lg font-medium">No papers found</p>
                    <p className="mt-2">Try adjusting your search criteria</p>
                  </div>
                )}
              </>
            ) : (
              <ReadingList
                onPaperSelect={setSelectedPaper}
                selectedPaperId={selectedPaper?.id}
              />
            )}
          </div>
        </div>

        <PaperSidebar
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      </div>
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