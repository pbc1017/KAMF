'use client';

import { Zone } from '@kamf/interface/types/festival.js';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedZone: Zone | 'all';
  onZoneChange: (zone: Zone | 'all') => void;
}

const zoneOptions = [
  { value: 'all' as const, label: '전체' },
  { value: Zone.BOOTH, label: '부스' },
  { value: Zone.INFO, label: '안내소' },
  { value: Zone.FOOD_TRUCK, label: '푸드트럭' },
  { value: Zone.HOF, label: 'HOF' },
];

export function SearchBar({
  searchQuery,
  onSearchChange,
  selectedZone,
  onZoneChange,
}: SearchBarProps) {
  return (
    <div className="card-purple p-8 rounded-3xl shadow-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 검색창 */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-lg font-medium text-white mb-3">
            부스 검색
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
              className="block w-full pl-12 pr-4 py-4 bg-gradient-to-r from-purple-800/20 to-indigo-800/20 backdrop-blur-sm border border-purple-500/20 rounded-2xl text-black placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 text-lg"
              placeholder="부스명이나 설명으로 검색하세요..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Zone 필터 */}
        <div className="md:w-56">
          <label htmlFor="zone" className="block text-lg font-medium text-white mb-3">
            구역 필터
          </label>
          <select
            id="zone"
            className="block w-full py-4 px-4 bg-gradient-to-r from-purple-800/20 to-indigo-800/20 backdrop-blur-sm border border-purple-500/20 text-black rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 text-lg"
            value={selectedZone}
            onChange={e => onZoneChange(e.target.value as Zone | 'all')}
          >
            {zoneOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-purple-900 text-black">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
