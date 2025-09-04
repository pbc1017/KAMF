'use client';

import { useTranslations } from 'next-intl';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  const t = useTranslations('search');
  return (
    <div className="card-purple p-8 rounded-3xl shadow-2xl">
      {/* 검색창 */}
      <div>
        <label htmlFor="search" className="block text-lg font-medium text-white mb-3">
          {t('title')}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-6 w-6 text-purple-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            id="search"
            className="block w-full pl-4 pr-4 py-4 bg-gradient-to-r from-purple-800/20 to-indigo-800/20 backdrop-blur-sm border border-purple-500/20 rounded-2xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 text-lg"
            placeholder={t('placeholder')}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
