import React, { useState, useEffect } from 'react';
import { TopicPicker } from './TopicPicker';
import { MessageSquare, Save, Loader2, X, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Paper } from '../types';
import { fetchWithCorsProxy } from '../lib/corsProxy';
import { PaperCard } from './PaperCard';

const ARXIV_API_URL = 'https://export.arxiv.org/api/query';

interface SavedDigest {
  id: string;
  name: string;
  topics: string;
  description: string;
  createdAt: number;
}

interface DigestProps {
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId?: string;
}

export function Digest({ onPaperSelect, selectedPaperId }: DigestProps) {
  const { user } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNaming, setIsNaming] = useState(false);
  const [digestName, setDigestName] = useState('');
  const [savedDigests, setSavedDigests] = useState<SavedDigest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [digestResults, setDigestResults] = useState<Record<string, Paper[]>>({});

  useEffect(() => {
    if (!user) {
      setSavedDigests([]);
      setIsLoading(false);
      return;
    }

    const digestsRef = query(
      collection(db, 'digests'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(digestsRef, (snapshot) => {
      const digests = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }) as SavedDigest).sort((a, b) => b.createdAt - a.createdAt);

      setSavedDigests(digests);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || savedDigests.length === 0) return;

    const fetchDigestResults = async () => {
      const today = new Date().toISOString().split('T')[0];
      const results: Record<string, Paper[]> = {};

      for (const digest of savedDigests) {
        try {
          const digestResultsRef = collection(
            db,
            'daily_digest_results',
            user.uid,
            today,
            digest.name,
            'results'
          );

          const snapshot = await getDocs(digestResultsRef);
          const paperPromises = snapshot.docs.map(async (doc) => {
            const { arxiv_id, reason, relevancy_score } = doc.data();

            const params = new URLSearchParams({
              id_list: arxiv_id,
            });

            const arxivUrl = `${ARXIV_API_URL}?${params}`;
            console.log('Fetching paper from:', arxivUrl);

            const response = await fetchWithCorsProxy(arxivUrl, {
              headers: {
                'Accept': 'application/xml'
              }
            });

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            const entry = xmlDoc.querySelector('entry');

            if (!entry) return null;

            return {
              id: arxiv_id,
              title: entry.querySelector('title')?.textContent?.replace(/\n/g, ' ').trim() || '',
              authors: Array.from(entry.querySelectorAll('author name'))
                .map(name => name.textContent || ''),
              summary: entry.querySelector('summary')?.textContent?.replace(/\n/g, ' ').trim() || '',
              published: entry.querySelector('published')?.textContent || '',
              category: entry.querySelector('category')?.getAttribute('term') || 'Unknown',
              link: entry.querySelector('link[type="text/html"]')?.getAttribute('href') || arxiv_id,
              reason,
              relevancy_score
            };
          });

          const papers = (await Promise.all(paperPromises)).filter((p): p is Paper => p !== null);
          papers.sort((a, b) => (b as any).relevancy_score - (a as any).relevancy_score);
          results[digest.name] = papers;
        } catch (error) {
          console.error(`Error fetching results for digest ${digest.name}:`, error);
          results[digest.name] = [];
        }
      }

      setDigestResults(results);
    };

    fetchDigestResults();
  }, [user, savedDigests]);

  const handleDeleteDigest = async (digestId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'digests', digestId));
    } catch (error) {
      console.error('Error deleting digest:', error);
    }
  };

  const handleSave = async () => {
    if (!user || isSaving) return;

    if (!isNaming) {
      setIsNaming(true);
      return;
    }

    if (!digestName.trim()) {
      setError('Please enter a name for your digest');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const digestData = {
        userId: user.uid,
        name: digestName.trim(),
        topics: selectedTopics.join(','),
        description: description,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'digests'), digestData);

      // Clear form after successful save
      setSelectedTopics([]);
      setDescription('');
      setDigestName('');
      setIsNaming(false);
    } catch (error) {
      console.error('Error saving digest:', error);
      setError('Failed to save digest. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsNaming(false);
    setDigestName('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Digest
        </h1>

        <div className="max-w-3xl mx-auto mb-8">
          <p className="text-center text-gray-600 text-lg leading-relaxed">
            Create your personalized ArXiv digest by selecting topics and describing your research interests.
            Every night, we'll analyze new papers that match your criteria and provide a curated digest with
            summaries of the most relevant papers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <TopicPicker
              selectedTopics={selectedTopics}
              onTopicsChange={setSelectedTopics}
            />

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Interests Description</h2>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Describe the types of papers you're interested in using natural language
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., I'm interested in papers about large language models, particularly those focusing on efficiency and environmental impact..."
                  className="w-full h-32 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              {isNaming ? (
                <div className="w-full space-y-4">
                  <input
                    type="text"
                    value={digestName}
                    onChange={(e) => setDigestName(e.target.value)}
                    placeholder="Enter digest name..."
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !digestName.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Digest
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving || selectedTopics.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  Save Digest
                </button>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <section className="space-y-6 mb-12">
              <h2 className="text-2xl font-semibold text-gray-900">Your Saved Digests</h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : savedDigests.length === 0 ? (
                <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow">
                  <p className="text-lg font-medium">No saved digests</p>
                  <p className="mt-2">Create your first digest using the form on the left</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedDigests.map((digest) => (
                    <div key={digest.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{digest.name}</h3>
                        <button
                          onClick={() => handleDeleteDigest(digest.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {digest.topics.split(',').map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap">{digest.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Today's Papers</h2>
              {savedDigests.map((digest) => (
                <div key={digest.id} className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{digest.name}</h3>
                  {digestResults[digest.name]?.length > 0 ? (
                    <div className="space-y-4">
                      {digestResults[digest.name].map((paper) => (
                        <div key={paper.id} className="space-y-2">
                          <PaperCard
                            key={paper.id}
                            paper={paper}
                            onSelect={() => onPaperSelect(paper)}
                            isSelected={paper.id === selectedPaperId}
                          />
                          <div className="ml-4 text-sm text-gray-600">
                            <span className="font-medium">Why it's relevant: </span>
                            {(paper as any).reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No papers found for today</p>
                  )}
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}