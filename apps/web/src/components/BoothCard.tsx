'use client';

import { Booth, Zone } from '@kamf/interface/types/festival.type.js';
import { forwardRef } from 'react';

interface BoothCardProps {
  booth: Booth;
  searchQuery?: string;
  isSelected?: boolean;
  onClick?: (boothNumber: string) => void;
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

export const BoothCard = forwardRef<HTMLDivElement, BoothCardProps>(function BoothCard(
  { booth, searchQuery = '', isSelected = false, onClick },
  ref
) {
  const handleClick = () => {
    onClick?.(booth.boothNumber);
  };

  return (
    <div
      ref={ref}
      className={`relative card-purple card-purple-hover p-8 group cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-purple-400 bg-purple-800/40 scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`text-2xl font-semibold mb-3 transition-all duration-300 ${
              isSelected ? 'text-purple-300' : 'text-white group-hover:text-purple-gradient'
            }`}
          >
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
          <span
            className={`text-sm font-medium transition-colors ${
              isSelected ? 'text-purple-200' : 'text-purple-300'
            }`}
          >
            #{booth.boothNumber}
          </span>
        </div>
      </div>

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
});
