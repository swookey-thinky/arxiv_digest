import React from 'react';
import { BookOpen, Tag, Search, List, Calendar, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Help() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Papers</span>
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Help & Instructions</h1>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Date Selection</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Use the date picker to select a range of dates to view papers from. By default, it shows papers from the last 24 hours.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note about time zones:</strong> Dates are shown in UTC (Coordinated Universal Time).
                Depending on your local time zone, papers might appear in a different date range than expected.
                For example, if you're in Pacific Time (UTC-7/8), papers published at 5pm UTC will show up as 10am PT on the same day.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Tags</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Tags help you organize papers. You can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Add tags to papers by clicking the "Add tag" button on any paper</li>
              <li>Create new tags or use existing ones</li>
              <li>Filter papers by tag using the tag filter in the sidebar</li>
              <li>Use the "Reading List" tag to save papers for later reading</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Search</h2>
            </div>
            <p className="text-gray-600 mb-4">
              There are two ways to search for papers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Title Search: Search for papers by their titles</li>
              <li>Keyword Search: Search for papers containing specific keywords</li>
              <li>Custom Queries: Save and use custom ArXiv queries for specific topics</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Reading List</h2>
            </div>
            <p className="text-gray-600 mb-4">
              The Reading List feature helps you keep track of papers you want to read later:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Add papers to your reading list by using the "Reading List" tag</li>
              <li>Access your reading list by clicking the "Reading List" tab at the top</li>
              <li>Papers in your reading list persist across sessions</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
            </div>
            <p className="text-gray-600 mb-4">
              We welcome your feedback and suggestions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>
                Submit feature requests and bug reports on our{' '}
                <a
                  href="https://github.com/swookey-thinky/arxiv_digest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  GitHub page
                </a>
              </li>
              <li>
                Direct message{' '}
                <a
                  href="https://twitter.com/samuelwookey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  @samuelwookey
                </a>
                {' '}on Twitter
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}