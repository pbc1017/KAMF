'use client';

import { Zone } from '@kamf/interface/types/festival.js';
import { useState, useMemo, Suspense } from 'react';

import { BoothCard } from '@/components/BoothCard';
import { SearchBar } from '@/components/SearchBar';
import { useBooths } from '@/hooks/useBooths';

// 동적 렌더링 강제 설정 - 빌드 시 정적 생성 방지
export const dynamic = 'force-dynamic';

// 로딩 컴포넌트
function BoothListSkeleton() {
  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="animate-pulse">
            <div className="h-16 bg-purple-400/20 rounded-lg mb-6 mx-auto max-w-md"></div>
            <div className="h-6 bg-purple-300/20 rounded-lg mx-auto max-w-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-purple-400/20 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </main>
  );
}

// 실제 부스 리스트 컴포넌트
function BoothListContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<Zone | 'all'>('all');
  const { data: boothsResponse } = useBooths();
  const booths = boothsResponse.data;

  const filteredBooths = useMemo(() => {
    return booths.filter(booth => {
      // Zone 필터
      const zoneMatch = selectedZone === 'all' || booth.zone === selectedZone;

      // 검색어 필터
      const searchMatch =
        !searchQuery ||
        booth.titleKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booth.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booth.descriptionKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booth.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());

      return zoneMatch && searchMatch;
    });
  }, [booths, searchQuery, selectedZone]);

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="animate-float">
            <h1 className="text-6xl font-bold text-white mb-6">
              KAMF <span className="text-purple-gradient">부스</span>
            </h1>
            <p className="text-2xl text-purple-200 font-medium">
              다양한 부스와 음식, 체험존을 둘러보세요
            </p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
          />
        </div>

        {/* 결과 수 표시 */}
        <div className="mb-8">
          <div className="card-purple p-6 rounded-2xl inline-block">
            <p className="text-purple-100 text-lg">
              총{' '}
              <span className="font-bold text-purple-gradient text-xl">
                {filteredBooths.length}
              </span>
              개의 부스가 있습니다
            </p>
          </div>
        </div>

        {/* 부스 리스트 */}
        {filteredBooths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooths.map(booth => (
              <BoothCard key={booth.id} booth={booth} searchQuery={searchQuery} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="card-purple p-12 rounded-3xl max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-purple-400 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.071-2.33"
                />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-3">검색 결과가 없습니다</h3>
              <p className="text-purple-200 text-lg">다른 검색어나 필터를 시도해보세요.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// 메인 컴포넌트 - Suspense로 감싸기
export default function BoothListPage() {
  return (
    <Suspense fallback={<BoothListSkeleton />}>
      <BoothListContent />
    </Suspense>
  );
}
