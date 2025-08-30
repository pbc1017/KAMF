'use client';

import { Booth, Zone } from '@kamf/interface/types/festival.js';

interface BoothCardProps {
  booth: Booth;
  searchQuery?: string;
}

const zoneColors = {
  [Zone.BOOTH]: 'bg-blue-100 text-blue-800',
  [Zone.INFO]: 'bg-green-100 text-green-800',
  [Zone.FOOD_TRUCK]: 'bg-orange-100 text-orange-800',
  [Zone.HOF]: 'bg-purple-100 text-purple-800',
};

const zoneLabels = {
  [Zone.BOOTH]: '부스',
  [Zone.INFO]: '안내소',
  [Zone.FOOD_TRUCK]: '푸드트럭',
  [Zone.HOF]: 'HOF',
};

function highlightText(text: string, query: string) {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function BoothCard({ booth, searchQuery = '' }: BoothCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${zoneColors[booth.zone]}`}
          >
            {zoneLabels[booth.zone]}
          </span>
          <span className="text-sm text-gray-500">#{booth.id}</span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {highlightText(booth.titleKr, searchQuery)}
        </h3>

        <p className="text-sm text-gray-600 mb-3">{highlightText(booth.titleEn, searchQuery)}</p>

        <p className="text-gray-700 text-sm leading-relaxed">
          {highlightText(booth.description, searchQuery)}
        </p>
      </div>
    </div>
  );
}
