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
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* 검색창 */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            부스 검색
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="부스명이나 설명으로 검색하세요..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Zone 필터 */}
        <div className="md:w-48">
          <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
            구역 필터
          </label>
          <select
            id="zone"
            className="block w-full py-3 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={selectedZone}
            onChange={e => onZoneChange(e.target.value as Zone | 'all')}
          >
            {zoneOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
