'use client';

import { StageWithDay, StageType, FestivalDay } from '@kamf/interface/types/festival.type.js';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, forwardRef } from 'react';

import { ShareButton } from '@/components/ui/ShareButton';

interface StageCardProps {
  stage: StageWithDay;
  isSelected?: boolean;
  onClick?: (stageId: string) => void;
}

const stageTypeGradients = {
  [StageType.OPEN_STAGE]: 'from-green-600 to-emerald-600',
  [StageType.MAIN_STAGE]: 'from-orange-600 to-red-600',
};

// stageTypeLabels는 이제 useTranslations를 통해 처리

export const StageCard = forwardRef<HTMLDivElement, StageCardProps>(function StageCard(
  { stage, isSelected = false, onClick },
  ref
) {
  const locale = useLocale();
  const stages = useTranslations('stages');
  const shareTranslations = useTranslations('share');
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

  // 공유 URL 및 콘텐츠 생성 (클라이언트 사이드에서만)
  const shareData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const dayParam = stage.day === FestivalDay.SATURDAY ? 'SAT' : 'FRI';
    const url = `${origin}/stages?day=${dayParam}&id=${stage.id.toString()}`;
    const title = `${mainTitle} - KAMF 2025`;
    const text = `${shareTranslations('stageShareText')} ${mainTitle}: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`;

    return { url, title, text };
  }, [stage.id, stage.day, mainTitle, description, shareTranslations]);

  const handleClick = () => {
    onClick?.(stage.id.toString());
  };

  return (
    <div
      ref={ref}
      className={`relative card-purple card-purple-hover p-8 group cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-purple-400 bg-purple-800/40 scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      onClick={handleClick}
    >
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

      <h3
        className={`text-2xl font-bold mb-3 transition-all duration-300 ${
          isSelected ? 'text-purple-300' : 'text-white group-hover:text-purple-gradient'
        }`}
      >
        {mainTitle}
      </h3>

      {subTitle && <p className="text-lg text-purple-300 mb-4 font-medium italic">{subTitle}</p>}

      <p className="text-purple-100 leading-relaxed text-lg">{description}</p>

      {/* 공유 버튼 */}
      <div
        className="absolute top-2 right-2 z-10"
        onClick={e => e.stopPropagation()} // 부모 카드 클릭 이벤트 전파 방지
      >
        <ShareButton title={shareData.title} text={shareData.text} url={shareData.url} />
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
