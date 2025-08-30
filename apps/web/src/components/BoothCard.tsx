'use client';

import { Booth, Zone } from '@kamf/interface/types/festival.js';

interface BoothCardProps {
  booth: Booth;
  searchQuery?: string;
}

const zoneColors = {
  [Zone.BOOTH]: 'from-purple-600 to-indigo-600',
  [Zone.INFO]: 'from-purple-500 to-violet-600',
  [Zone.FOOD_TRUCK]: 'from-purple-500 to-pink-500',
  [Zone.NIGHT_MARKET]: 'from-violet-600 to-purple-600',
};

const zoneLabels = {
  [Zone.BOOTH]: '부스',
  [Zone.INFO]: '안내소',
  [Zone.FOOD_TRUCK]: '푸드트럭',
  [Zone.NIGHT_MARKET]: '야시장',
};

function highlightText(text: string, query: string) {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-violet-600 px-1 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function BoothCard({ booth, searchQuery = '' }: BoothCardProps) {
  return (
    <div className="card-purple card-purple-hover p-8 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-purple-gradient transition-all duration-300">
            {highlightText(booth.titleKo, searchQuery)}
          </h3>

          <p className="text-lg text-purple-300 mb-4 font-medium">
            {highlightText(booth.titleEn, searchQuery)}
          </p>

          <p className="text-purple-100 leading-relaxed text-lg">
            {highlightText(booth.descriptionKo, searchQuery)}
          </p>
        </div>

        <div className="ml-6 flex-shrink-0 flex flex-col items-end space-y-2">
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${zoneColors[booth.zone]} text-white shadow-lg`}
          >
            {zoneLabels[booth.zone]}
          </span>
          <span className="text-purple-300 text-sm font-medium">#{booth.id}</span>
        </div>
      </div>
    </div>
  );
}
