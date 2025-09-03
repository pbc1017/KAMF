'use client';

import { Booth, Zone } from '@kamf/interface/types/festival.type.js';
import { useState } from 'react';

import { getBoothPosition as getBoothCoordinates } from '@/config/booth-coordinates';

interface BoothMapViewerProps {
  booths: Booth[];
  selectedBoothNumber: string | null;
  onBoothClick?: (boothNumber: string) => void;
}

// 부스 좌표는 @/config/booth-coordinates.ts 파일에서 관리됩니다
// 좌표 수정이 필요한 경우 해당 파일을 편집해주세요

// Zone별 색상 정의 (마커 색상용)
const zoneColors = {
  [Zone.INFO]: 'from-blue-600 to-cyan-600',
  [Zone.FOOD_TRUCK]: 'from-orange-600 to-red-600',
  [Zone.BOOTH]: 'from-purple-600 to-indigo-600',
  [Zone.NIGHT_MARKET]: 'from-pink-600 to-rose-600',
};

// getBoothPosition 함수는 @/config/booth-coordinates.ts에서 가져옵니다

export function BoothMapViewer({ booths, selectedBoothNumber, onBoothClick }: BoothMapViewerProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleBoothMarkerClick = (boothNumber: string) => {
    onBoothClick?.(boothNumber);
  };

  // Zone별로 부스 그룹화 (범례용)
  const boothsByZone = booths.reduce(
    (acc, booth) => {
      if (!acc[booth.zone]) {
        acc[booth.zone] = [];
      }
      acc[booth.zone].push(booth);
      return acc;
    },
    {} as Record<Zone, Booth[]>
  );

  // 각 부스의 위치 매핑
  const boothPositions = booths.map(booth => {
    const position = getBoothCoordinates(booth.boothNumber);

    return {
      booth,
      position,
    };
  });

  // Zone 라벨 정의
  const zoneLabels = {
    [Zone.INFO]: '안내소',
    [Zone.FOOD_TRUCK]: '푸드트럭',
    [Zone.BOOTH]: '부스',
    [Zone.NIGHT_MARKET]: '야시장',
  };

  return (
    <div className="relative w-full h-full">
      {/* 지도 이미지 */}
      <div
        className="relative w-full bg-gray-900 rounded-2xl overflow-hidden"
        style={{ aspectRatio: '1330 / 1908' }}
      >
        <img
          src="/kamf_map.png"
          alt="KAMF 축제 지도"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
        />

        {/* 로딩 상태 */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-purple-300 text-lg">지도를 불러오는 중...</div>
          </div>
        )}

        {/* 개별 좌표 매핑 시스템으로 변경 - Zone 영역 표시 제거됨 */}

        {/* 부스 마커들 */}
        {isImageLoaded &&
          boothPositions.map(({ booth, position }) => {
            const isSelected = selectedBoothNumber === booth.boothNumber;

            return (
              <div
                key={booth.boothNumber}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  isSelected ? 'z-20' : 'z-10'
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onClick={() => handleBoothMarkerClick(booth.boothNumber)}
                title={`${booth.titleKo} (${booth.boothNumber}번)`}
              >
                {/* 부스 마커 */}
                <div
                  className={`relative rounded-full border transition-all duration-300 ${
                    isSelected
                      ? `w-4 h-4 md:w-5 md:h-5 bg-gradient-to-r ${zoneColors[booth.zone]} shadow-lg scale-150 border-white ring-2 ring-white/50`
                      : `w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r ${zoneColors[booth.zone]} hover:scale-125 border-white shadow-md`
                  }`}
                />

                {/* 선택된 부스 하이라이트 링 */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300/90 animate-pulse scale-200" />
                )}
              </div>
            );
          })}
      </div>

      {/* 범례 */}
      <div className="mt-4 p-4 card-purple rounded-xl">
        <h3 className="text-white font-semibold mb-3">지도 범례</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.values(Zone).map(zone => {
            const count = boothsByZone[zone]?.length || 0;
            if (count === 0) return null;

            return (
              <div key={zone} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-r ${zoneColors[zone]} border border-white/70 shadow-sm`}
                />
                <span className="text-purple-100 text-xs md:text-sm">
                  {zoneLabels[zone]} ({count}개)
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-purple-600/30">
          <p className="text-purple-200 text-xs">
            💡 지도의 점을 클릭하거나 오른쪽 목록에서 부스를 선택하세요
          </p>
        </div>
      </div>
    </div>
  );
}
