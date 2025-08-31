'use client';

import { FestivalDay, StageWithDay } from '@kamf/interface/types/festival.js';
import { useState, useMemo, Suspense } from 'react';

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
  const [selectedDay, setSelectedDay] = useState<FestivalDay>(FestivalDay.FRIDAY);
  const { data: stagesResponse } = useStages();

  // API 응답을 StageWithDay[] 형태로 변환
  const allStages = useMemo((): StageWithDay[] => {
    const { fri, sat } = stagesResponse.data;

    const friStages: StageWithDay[] = fri.map(stage => ({
      ...stage,
      day: FestivalDay.FRIDAY,
    }));

    const satStages: StageWithDay[] = sat.map(stage => ({
      ...stage,
      day: FestivalDay.SATURDAY,
    }));

    return [...friStages, ...satStages];
  }, [stagesResponse]);

  // 선택된 날짜에 해당하는 공연 필터링 및 시간순 정렬
  const filteredStages = allStages
    .filter(stage => stage.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="animate-float">
            <h1 className="text-6xl font-bold text-white mb-6">
              <span className="text-purple-gradient">무대</span> 프로그램
            </h1>
            <p className="text-2xl text-purple-200 font-medium">
              KAMF 2025의 다양한 공연 일정을 확인해보세요
            </p>
          </div>
        </div>

        {/* 날짜 선택 */}
        <div className="mb-12">
          <SegmentControl selectedDay={selectedDay} onDayChange={setSelectedDay} />
        </div>

        {/* 공연 목록 */}
        <div className="space-y-6">
          {filteredStages.length > 0 ? (
            filteredStages.map(stage => <StageCard key={stage.id} stage={stage} />)
          ) : (
            <div className="text-center py-16">
              <div className="card-purple p-12 rounded-3xl max-w-md mx-auto">
                <div className="text-6xl mb-6">🎭</div>
                <h3 className="text-2xl font-bold text-white mb-3">예정된 공연이 없습니다</h3>
                <p className="text-purple-200 text-lg">해당 날짜에 예정된 공연이 없습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-16 text-center">
          <div className="card-purple p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-4">🎪 공연 안내</h3>
            <p className="text-purple-100 leading-relaxed text-lg">
              모든 공연은 날씨나 현장 상황에 따라 변경될 수 있습니다.
              <br />
              최신 정보는 현장 안내데스크에서 확인해주세요.
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
