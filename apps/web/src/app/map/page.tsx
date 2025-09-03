import Link from 'next/link';

import { getTodayStagesUrl } from '@/utils/stages';

// 지도 구역 정보
const mapAreas = [
  {
    id: 'stage',
    nameKr: '무대',
    nameEn: 'Stage',
    url: getTodayStagesUrl(),
    available: true,
    position: 'top-8 left-1/2 transform -translate-x-1/2',
    color:
      'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
  },
  {
    id: 'info',
    nameKr: '안내',
    nameEn: 'Info',
    url: '/map/info',
    available: true,
    position: 'top-20 right-8',
    color:
      'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
  },
  {
    id: 'booth',
    nameKr: '부스',
    nameEn: 'Booth',
    url: '/map/booth',
    available: true,
    position: 'top-1/2 left-8 transform -translate-y-1/2',
    color:
      'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
  },
  {
    id: 'food',
    nameKr: '푸드',
    nameEn: 'Food',
    url: '/map/food-truck',
    available: true,
    position: 'top-1/2 right-8 transform -translate-y-1/2',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
  },
  {
    id: 'nightMarket',
    nameKr: '야시장',
    nameEn: 'Night Market',
    url: '/map/night-market',
    available: true,
    position: 'bottom-8 left-1/2 transform -translate-x-1/2',
    color:
      'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
  },
];

export default function MapPage() {
  return (
    <main className="min-h-screen bg-purple-organic organic-overlay">
      {/* 헤더 */}
      <div className="text-center py-16">
        <div>
          <h1 className="text-6xl font-bold text-white mb-6">
            KAMF <span className="text-purple-gradient">축제 지도</span>
          </h1>
          <p className="text-2xl text-purple-200">원하는 구역을 선택해주세요</p>
        </div>
      </div>

      {/* 지도 컨테이너 */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative w-full h-96 md:h-[500px] card-purple card-purple-hover rounded-3xl overflow-hidden mb-12">
          {/* 지도 배경 패턴 */}
          <div className="absolute inset-4 bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-purple-800/20 rounded-2xl"></div>

          {/* 구역 버튼들 */}
          {mapAreas.map(area => (
            <div key={area.id} className={`absolute ${area.position}`}>
              {area.available ? (
                <Link href={area.url}>
                  <button
                    className={`
                      ${area.color} text-white font-bold py-4 px-6 rounded-2xl shadow-lg
                      transform transition-all duration-300 hover:scale-110
                      border-2 border-white/20 backdrop-blur-sm
                      min-w-[120px] md:min-w-[140px]
                    `}
                  >
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold">{area.nameKr}</div>
                      <div className="text-sm md:text-base opacity-90">{area.nameEn}</div>
                    </div>
                  </button>
                </Link>
              ) : (
                <button
                  className="
                    bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-bold py-4 px-6 rounded-2xl shadow-lg
                    border-2 border-white/10 cursor-not-allowed
                    min-w-[120px] md:min-w-[140px] opacity-60
                  "
                  disabled
                >
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-bold">{area.nameKr}</div>
                    <div className="text-sm md:text-base opacity-90">{area.nameEn}</div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="pb-16"></div>
    </main>
  );
}
