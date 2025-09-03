'use client';

import { Zone, Booth } from '@kamf/interface/types/festival.type.js';
import { useState, useMemo, Suspense, useRef } from 'react';

import { BoothCard } from '@/components/BoothCard';
import { BoothMapViewer } from '@/components/BoothMapViewer';
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
  const [selectedBoothNumber, setSelectedBoothNumber] = useState<string | null>(null);
  const { data: boothsResponse } = useBooths();
  const booths = boothsResponse.data;

  // 스크롤을 위한 ref들
  const mapRef = useRef<HTMLDivElement>(null);
  const boothCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isScrolling, setIsScrolling] = useState(false);

  const filteredBooths = useMemo(() => {
    return booths.filter((booth: Booth) => {
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

  // 헤더 높이를 계산하는 함수
  const getHeaderHeight = () => {
    const header = document.querySelector('header') || document.querySelector('[role="banner"]');
    return header ? header.getBoundingClientRect().height : 80; // 기본값 80px
  };

  // 스크롤 함수들
  const scrollToBoothCard = (boothNumber: string) => {
    if (isScrolling) return; // 이미 스크롤 중이면 실행하지 않음

    const element = boothCardRefs.current[boothNumber];
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

  const scrollToMap = () => {
    if (isScrolling) return; // 이미 스크롤 중이면 실행하지 않음

    if (mapRef.current) {
      // 헤더 높이만큼 오프셋 계산
      const headerHeight = getHeaderHeight();
      const rect = mapRef.current.getBoundingClientRect();
      const isVisible = rect.top >= headerHeight && rect.top <= window.innerHeight * 0.5;

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

  const handleMapBoothClick = (boothNumber: string) => {
    const wasSelected = selectedBoothNumber === boothNumber;
    setSelectedBoothNumber(prev => (prev === boothNumber ? null : boothNumber));

    // 새로 선택된 경우에만 스크롤 (토글로 해제하는 경우는 스크롤 안함)
    if (!wasSelected) {
      setTimeout(() => scrollToBoothCard(boothNumber), 150);
    }
  };

  const handleBoothCardClick = (boothNumber: string) => {
    const wasSelected = selectedBoothNumber === boothNumber;
    setSelectedBoothNumber(prev => (prev === boothNumber ? null : boothNumber));

    // 새로 선택된 경우에만 지도로 스크롤
    if (!wasSelected) {
      setTimeout(() => scrollToMap(), 150);
    }
  };

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div>
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

        {/* 메인 컨텐츠: 지도 + 부스 리스트 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* 지도 영역 */}
          <div className="xl:sticky xl:top-8 xl:h-fit" ref={mapRef}>
            <BoothMapViewer
              booths={booths}
              selectedBoothNumber={selectedBoothNumber}
              onBoothClick={handleMapBoothClick}
            />
          </div>

          {/* 부스 리스트 영역 */}
          <div>
            {filteredBooths.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredBooths.map((booth: Booth) => (
                  <BoothCard
                    key={booth.id}
                    booth={booth}
                    searchQuery={searchQuery}
                    isSelected={selectedBoothNumber === booth.boothNumber}
                    onClick={handleBoothCardClick}
                    ref={(el: HTMLDivElement | null) => {
                      if (el) {
                        boothCardRefs.current[booth.boothNumber] = el;
                      }
                    }}
                  />
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
        </div>
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
