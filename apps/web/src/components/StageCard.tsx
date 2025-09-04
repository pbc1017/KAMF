'use client';

import { StageWithDay, StageType } from '@kamf/interface/types/festival.type.js';
import { useLocale, useTranslations } from 'next-intl';

interface StageCardProps {
  stage: StageWithDay;
}

const stageTypeGradients = {
  [StageType.OPEN_STAGE]: 'from-green-600 to-emerald-600',
  [StageType.MAIN_STAGE]: 'from-orange-600 to-red-600',
};

// stageTypeLabels는 이제 useTranslations를 통해 처리

export function StageCard({ stage }: StageCardProps) {
  const locale = useLocale();
  const stages = useTranslations('stages');
  const isEnglish = locale === 'en';

  // 언어에 따른 필드 선택
  const mainTitle = isEnglish ? stage.titleEn : stage.titleKo;
  const subTitle = stage.titleKo; // 부제목은 항상 한글
  const description = isEnglish ? stage.descriptionEn : stage.descriptionKo;

  // Stage type 라벨 매핑
  const getStageTypeLabel = (stageType: StageType) => {
    switch (stageType) {
      case StageType.OPEN_STAGE:
        return stages('openStage');
      case StageType.MAIN_STAGE:
        return stages('mainStage');
      default:
        return stageType;
    }
  };
  return (
    <div className="card-purple card-purple-hover p-8 group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/30 text-purple-100 px-4 py-2 rounded-full text-lg font-medium shadow-lg">
            {stage.startTime} - {stage.endTime}
          </div>
          <div
            className={`bg-gradient-to-r ${stageTypeGradients[stage.stageType]} text-white px-3 py-1 rounded-full text-sm font-medium shadow-md`}
          >
            {getStageTypeLabel(stage.stageType)}
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-gradient transition-all duration-300">
        {mainTitle}
      </h3>

      {subTitle && <p className="text-lg text-purple-300 mb-4 font-medium italic">{subTitle}</p>}

      <p className="text-purple-100 leading-relaxed text-lg">{description}</p>
    </div>
  );
}
