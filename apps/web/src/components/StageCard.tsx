'use client';

import { StageWithDay } from '@kamf/interface/types/festival.js';

interface StageCardProps {
  stage: StageWithDay;
}

export function StageCard({ stage }: StageCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            {stage.startTime} - {stage.endTime}
          </div>
          <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
            {stage.day}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{stage.titleKo}</h3>

      {stage.titleEn && <p className="text-gray-500 text-sm mb-3 italic">{stage.titleEn}</p>}

      <p className="text-gray-600 text-sm leading-relaxed">{stage.descriptionKo}</p>
    </div>
  );
}
