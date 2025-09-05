'use client';

import { FestivalDay, StageWithDay, Stage } from '@kamf/interface/types/festival.type.js';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, Suspense, useEffect, useState, useRef } from 'react';

import { SegmentControl } from '@/components/SegmentControl';
import { StageCard } from '@/components/StageCard';
import { useStages } from '@/hooks/useStages';

// 동적 렌더링 강제 설정 - 빌드 시 정적 생성 방지
export const dynamic = 'force-dynamic';

// 로딩 컴포넌트
function StagesPageSkeleton() {
  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 스켈레톤 */}
        <div className="text-center mb-12">
          <div className="animate-pulse">
            <div className="h-16 bg-purple-400/20 rounded-lg mb-6 mx-auto max-w-md"></div>
            <div className="h-8 bg-purple-300/20 rounded-lg mx-auto max-w-lg"></div>
          </div>
        </div>

        {/* 날짜 선택 스켈레톤 */}
        <div className="mb-12">
          <div className="h-12 bg-purple-400/20 rounded-lg animate-pulse"></div>
        </div>

        {/* 공연 목록 스켈레톤 */}
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-purple-400/20 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </main>
  );
}

function StagesPageContent() {
  const t = useTranslations('stage');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: stagesResponse } = useStages();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const stageCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // selectedDay 계산
  const selectedDay = searchParams.get('day') === 'SAT' ? FestivalDay.SATURDAY : FestivalDay.FRIDAY;

  // API 응답을 StageWithDay[] 형태로 변환
  const allStages = useMemo((): StageWithDay[] => {
    const { fri, sat } = stagesResponse.data;

    const friStages: StageWithDay[] = fri.map((stage: Stage) => ({
      ...stage,
      day: FestivalDay.FRIDAY,
    }));

    const satStages: StageWithDay[] = sat.map((stage: Stage) => ({
      ...stage,
      day: FestivalDay.SATURDAY,
    }));

    return [...friStages, ...satStages];
  }, [stagesResponse]);

  // 쿼리파라미터가 없거나 유효하지 않으면 FRI로 리다이렉트
  useEffect(() => {
    const dayParam = searchParams.get('day');
    if (!dayParam || (dayParam !== 'FRI' && dayParam !== 'SAT')) {
      router.replace('/stages?day=FRI', { scroll: false });
    }
  }, [searchParams, router]);

  // 헤더 높이를 계산하는 함수
  const getHeaderHeight = () => {
    const header = document.querySelector('header') || document.querySelector('[role="banner"]');
    return header ? header.getBoundingClientRect().height : 80; // 기본값 80px
  };

  // 스테이지 카드로 스크롤하는 함수
  const scrollToStageCard = (stageId: string) => {
    if (isScrolling) return; // 이미 스크롤 중이면 실행하지 않음

    const element = stageCardRefs.current[stageId];
    if (element) {
      // 헤더 높이만큼 오프셋 계산
      const headerHeight = getHeaderHeight();
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= headerHeight && rect.bottom <= window.innerHeight;

      if (!isVisible) {
        setIsScrolling(true);

        // 헤더 높이를 고려한 스크롤 위치 계산
        const elementTop = window.scrollY + rect.top;
        const offsetPosition = elementTop - headerHeight - 20; // 추가 20px 여백

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        // 스크롤 완료 후 플래그 해제
        setTimeout(() => setIsScrolling(false), 800);
      }
    }
  };

  // URL 파라미터로 특정 스테이지 자동 선택 및 스크롤
  useEffect(() => {
    const stageId = searchParams.get('id');
    const dayParam = searchParams.get('day');

    if (stageId && dayParam && allStages.length > 0) {
      // 해당 스테이지 ID가 존재하고 올바른 날짜인지 확인
      const targetStage = allStages.find((stage: StageWithDay) => {
        const stageDayParam = stage.day === FestivalDay.SATURDAY ? 'SAT' : 'FRI';
        return stage.id.toString() === stageId && stageDayParam === dayParam;
      });

      if (targetStage && selectedStageId !== stageId) {
        // 올바른 날짜로 설정
        const correctDay = targetStage.day;
        if (selectedDay !== correctDay) {
          const correctDayParam = correctDay === FestivalDay.SATURDAY ? 'SAT' : 'FRI';
          router.replace(`/stages?day=${correctDayParam}&id=${stageId}`, { scroll: false });
          return;
        }

        // 스테이지 선택
        setSelectedStageId(stageId);

        // 약간의 딜레이 후 스크롤 (DOM 렌더링 완료 대기)
        setTimeout(() => {
          scrollToStageCard(stageId);
        }, 500);
      }
    }
  }, [searchParams, allStages, selectedStageId, selectedDay, router]);

  const handleDayChange = (day: FestivalDay) => {
    const dayParam = day === FestivalDay.SATURDAY ? 'SAT' : 'FRI';
    router.replace(`/stages?day=${dayParam}`, { scroll: false });

    // 날짜 변경 시 선택 해제
    setSelectedStageId(null);
  };

  const handleStageClick = (stageId: string) => {
    setSelectedStageId(prev => (prev === stageId ? null : stageId));

    // URL 파라미터 초기화 (사용자 직접 선택이므로)
    if (searchParams.get('id')) {
      const dayParam = selectedDay === FestivalDay.SATURDAY ? 'SAT' : 'FRI';
      router.replace(`/stages?day=${dayParam}`, { scroll: false });
    }
  };

  // 선택된 날짜에 해당하는 공연 필터링 및 시간순 정렬
  const filteredStages = allStages
    .filter(stage => stage.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div>
            <h1 className="text-6xl font-bold text-white mb-6">
              <span className="text-purple-gradient">{t('title')}</span>
            </h1>
            <p className="text-2xl text-purple-200 font-medium">{t('subtitle')}</p>
          </div>
        </div>

        {/* 날짜 선택 */}
        <div className="mb-12">
          <SegmentControl selectedDay={selectedDay} onDayChange={handleDayChange} />
        </div>

        {/* 공연 목록 */}
        <div className="space-y-6">
          {filteredStages.length > 0 ? (
            filteredStages.map((stage: StageWithDay) => (
              <StageCard
                key={stage.id}
                stage={stage}
                isSelected={selectedStageId === stage.id.toString()}
                onClick={handleStageClick}
                ref={(el: HTMLDivElement | null) => {
                  if (el) {
                    stageCardRefs.current[stage.id.toString()] = el;
                  }
                }}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <div className="card-purple p-12 rounded-3xl max-w-md mx-auto">
                <div className="text-6xl mb-6">🎭</div>
                <h3 className="text-2xl font-bold text-white mb-3">{t('noScheduled')}</h3>
                <p className="text-purple-200 text-lg">{t('noScheduledDescription')}</p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-16 text-center">
          <div className="card-purple p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-4">🎪 {t('performanceInfo')}</h3>
            <p className="text-purple-100 leading-relaxed text-lg">
              {t('performanceNotice')}
              <br />
              {t('contactInfo')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StagesPage() {
  return (
    <Suspense fallback={<StagesPageSkeleton />}>
      <StagesPageContent />
    </Suspense>
  );
}
