'use client';

import { Booth } from '@kamf/interface/types/festival.type.js';
import { useState } from 'react';

import { getBoothPosition as getBoothCoordinates } from '@/config/booth-coordinates';

interface BoothMapViewerProps {
  booths: Booth[];
  selectedBoothNumber: string | null;
  onBoothClick?: (boothNumber: string) => void;
}

// 부스 좌표는 @/config/booth-coordinates.ts 파일에서 관리됩니다
// 좌표 수정이 필요한 경우 해당 파일을 편집해주세요

export function BoothMapViewer({ booths, selectedBoothNumber, onBoothClick }: BoothMapViewerProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleBoothMarkerClick = (boothNumber: string) => {
    onBoothClick?.(boothNumber);
  };

  // 각 부스의 위치 매핑
  const boothPositions = booths.map(booth => {
    const position = getBoothCoordinates(booth.boothNumber);

    return {
      booth,
      position,
    };
  });

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
            const shouldShowVisually = !selectedBoothNumber || isSelected; // 시각적으로 보여줄지 결정

            return (
              <div
                key={booth.boothNumber}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  isSelected ? 'z-20' : 'z-10'
                } ${!shouldShowVisually ? 'opacity-0 hover:opacity-30 pointer-events-auto' : 'opacity-100'}`}
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
                      ? `w-4 h-4 md:w-5 md:h-5 bg-purple-500 shadow-lg scale-150 border-white ring-2 ring-white/50`
                      : `w-3 h-3 md:w-4 md:h-4 bg-purple-500 hover:scale-125 border-white shadow-md`
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

      {/* 사용 안내 */}
      <div className="mt-4 p-4 card-purple rounded-xl">
        <p className="text-purple-200 text-sm text-center">
          💡 지도의 점을 클릭하거나 오른쪽 목록에서 부스를 선택하세요
        </p>
      </div>
    </div>
  );
}
