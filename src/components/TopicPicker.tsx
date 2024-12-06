import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { ARXIV_TOPICS } from '../data/topics';

interface TopicPickerProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
}

export function TopicPicker({ selectedTopics, onTopicsChange }: TopicPickerProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const handleTopicToggle = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onTopicsChange(selectedTopics.filter(id => id !== topicId));
    } else {
      onTopicsChange([...selectedTopics, topicId]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics</h2>

      <div className="space-y-2">
        {Object.entries(ARXIV_TOPICS).map(([topic, subtopics]) => (
          <div key={topic} className="border rounded-lg">
            <button
              onClick={() => setExpandedTopic(expandedTopic === topic ? null : topic)}
              className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-700">{topic}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedTopic === topic ? 'transform rotate-180' : ''
                }`}
              />
            </button>

            {expandedTopic === topic && (
              <div className="px-4 py-2 border-t space-y-2">
                {subtopics.map(([name, id]) => (
                  <label
                    key={id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedTopics.includes(id)}
                      onChange={() => handleTopicToggle(id)}
                    />
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        selectedTopics.includes(id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedTopics.includes(id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-400 text-sm ml-auto">{id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTopics.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {selectedTopics.map(topicId => (
              <div
                key={topicId}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm"
              >
                <span>{topicId}</span>
                <button
                  onClick={() => handleTopicToggle(topicId)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}