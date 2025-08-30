'use client';

import { Zone } from '@kamf/interface';
import { Suspense } from 'react';

import { useBoothsByZone } from '@/hooks/useBoothsByZone';

// URL 파라미터(케밥케이스) → Zone enum(카멜케이스) 변환
const urlToZone = (urlParam: string): Zone | null => {
  const mapping: Record<string, Zone> = {
    booth: Zone.BOOTH,
    info: Zone.INFO,
    'food-truck': Zone.FOOD_TRUCK,
    'night-market': Zone.NIGHT_MARKET,
  };
  return mapping[urlParam] || null;
};

// Zone 정보 매핑
const zoneInfo = {
  [Zone.BOOTH]: {
    nameKr: '부스존',
    nameEn: 'Booth Zone',
    image: 'https://images.unsplash.com/photo-1541689221361-ad95003448db?w=800&h=400&fit=crop',
    bgGradient: 'from-purple-600 to-indigo-600',
  },
  [Zone.INFO]: {
    nameKr: '안내소',
    nameEn: 'Information',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
    bgGradient: 'from-purple-500 to-violet-600',
  },
  [Zone.FOOD_TRUCK]: {
    nameKr: '푸드트럭',
    nameEn: 'Food Truck',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop',
    bgGradient: 'from-purple-500 to-pink-500',
  },
  [Zone.NIGHT_MARKET]: {
    nameKr: '야시장',
    nameEn: 'Night Market Zone',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
    bgGradient: 'from-violet-600 to-purple-600',
  },
};

// 로딩 컴포넌트
function ZonePageSkeleton() {
  return (
    <main className="min-h-screen bg-purple-organic organic-overlay">
      {/* Zone 제목 섹션 스켈레톤 */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center animate-pulse">
            <div className="h-16 bg-white/20 rounded-lg mb-6 mx-auto max-w-md"></div>
            <div className="h-8 bg-white/20 rounded-lg mx-auto max-w-lg"></div>
          </div>
        </div>
      </div>

      {/* Zone 이미지 섹션 스켈레톤 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl animate-pulse bg-purple-400/20"></div>
      </div>

      {/* 부스 목록 섹션 스켈레톤 */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-10 bg-purple-400/20 rounded-lg mb-4 mx-auto max-w-xs"></div>
          <div className="h-6 bg-purple-300/20 rounded-lg mx-auto max-w-md"></div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-purple-400/20 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </main>
  );
}

function ZonePageContent({ zone }: { zone: Zone }) {
  const { data: boothsResponse } = useBoothsByZone(zone);
  const currentBooths = boothsResponse.data;
  const currentZoneInfo = zoneInfo[zone];

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay">
      {/* Zone 제목 섹션 */}
      <div className={`bg-gradient-to-r ${currentZoneInfo.bgGradient} shadow-xl`}>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center animate-float">
            <h1 className="text-6xl font-bold text-white mb-6">{currentZoneInfo.nameKr}</h1>
            <p className="text-2xl text-white/90 font-medium">{currentZoneInfo.nameEn}</p>
          </div>
        </div>
      </div>

      {/* Zone 이미지 섹션 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={currentZoneInfo.image}
            alt={`${currentZoneInfo.nameKr} 이미지`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-purple-900/20"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="card-purple p-4 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">{currentZoneInfo.nameKr}</h2>
              <p className="text-purple-200">{currentZoneInfo.nameEn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 부스 목록 섹션 */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">부스 목록</h2>
          <p className="text-xl text-purple-200">
            총 <span className="text-purple-gradient font-bold">{currentBooths.length}</span>개의
            부스
          </p>
        </div>

        <div className="space-y-6">
          {currentBooths.map(booth => (
            <div key={booth.id} className="card-purple card-purple-hover p-8 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-purple-gradient transition-all duration-300">
                    {booth.titleKo}
                  </h3>
                  <p className="text-lg text-purple-300 mb-4 font-medium">{booth.titleEn}</p>
                  <p className="text-purple-100 leading-relaxed text-lg">{booth.descriptionKo}</p>
                </div>
                <div className="ml-6 flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${currentZoneInfo.bgGradient} text-white shadow-lg`}
                  >
                    부스 #{booth.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentBooths.length === 0 && (
          <div className="text-center py-16">
            <div className="card-purple p-12 rounded-3xl">
              <div className="text-6xl mb-6">🏪</div>
              <p className="text-purple-200 text-xl font-medium">
                현재 이 구역에는 등록된 부스가 없습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ZonePage({ params }: { params: { zone: string } }) {
  const zone = urlToZone(params.zone);

  if (!zone) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-purple-organic organic-overlay">
        <div className="card-purple p-12 text-center rounded-3xl">
          <h1 className="text-4xl font-bold text-red-400 mb-4">잘못된 Zone입니다</h1>
          <p className="text-purple-200">유효한 zone: booth, info, food-truck, night-market</p>
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={<ZonePageSkeleton />}>
      <ZonePageContent zone={zone} />
    </Suspense>
  );
}
