'use client';

import { StageWithDay, FestivalDay } from '@kamf/interface/types/festival.type.js';

interface StageCardProps {
  stage: StageWithDay;
}

const gradientClasses = {
  [FestivalDay.FRIDAY]: 'from-purple-600 to-indigo-600',
  [FestivalDay.SATURDAY]: 'from-indigo-600 to-purple-600',
};

const dayLabels = {
  [FestivalDay.FRIDAY]: '금요일',
  [FestivalDay.SATURDAY]: '토요일',
};

export function StageCard({ stage }: StageCardProps) {
  return (
    <div className="card-purple card-purple-hover p-8 group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/30 text-purple-100 px-4 py-2 rounded-full text-lg font-medium shadow-lg">
            {stage.startTime} - {stage.endTime}
          </div>
          <div
            className={`bg-gradient-to-r ${gradientClasses[stage.day]} text-white px-3 py-1 rounded-full text-sm font-medium shadow-md`}
          >
            {dayLabels[stage.day]}
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-gradient transition-all duration-300">
        {stage.titleKo}
      </h3>

      {stage.titleEn && (
        <p className="text-lg text-purple-300 mb-4 font-medium italic">{stage.titleEn}</p>
      )}

      <p className="text-purple-100 leading-relaxed text-lg">{stage.descriptionKo}</p>
    </div>
  );
}
