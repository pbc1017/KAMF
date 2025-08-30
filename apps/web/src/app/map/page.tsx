import Link from 'next/link';

// 지도 구역 정보
const mapAreas = [
  {
    id: 'stage',
    nameKr: '무대',
    nameEn: 'Stage',
    url: '/stages',
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

// 부스별 운영 시간 정보
const operatingHours = [
  {
    zone: '부스존',
    hours: '10:00 - 18:00',
    description: '학과별 체험 부스',
    status: 'open',
  },
  {
    zone: '안내소',
    hours: '09:00 - 19:00',
    description: '종합 안내 및 분실물',
    status: 'open',
  },
  {
    zone: '푸드트럭',
    hours: '11:00 - 22:00',
    description: '다양한 음식 판매',
    status: 'open',
  },
  {
    zone: '야시장',
    hours: '17:00 - 24:00',
    description: '주류 및 안주 판매',
    status: 'open',
  },
  {
    zone: '무대',
    hours: '14:00 - 21:00',
    description: '공연 및 이벤트',
    status: 'open',
  },
];

export default function MapPage() {
  return (
    <main className="min-h-screen bg-purple-organic organic-overlay">
      {/* 헤더 */}
      <div className="text-center py-16">
        <div className="animate-float">
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

        {/* 부스별 운영 시간 */}
        <div className="card-purple rounded-3xl shadow-2xl p-8">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">부스별 운영 시간</h3>
          <div className="space-y-4">
            {operatingHours.map((booth, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-800/20 to-indigo-800/20 backdrop-blur-sm border border-purple-500/20 rounded-xl hover:border-purple-400/30 transition-all duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-xl font-semibold text-white">{booth.zone}</h4>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        booth.status === 'open'
                          ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-200 border border-green-400/30'
                          : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200 border border-yellow-400/30'
                      }`}
                    >
                      {booth.status === 'open' ? '운영중' : '준비중'}
                    </span>
                  </div>
                  <p className="text-purple-200 mt-2">{booth.description}</p>
                </div>
                <div className="text-right ml-6">
                  <div className="text-xl font-bold text-white">{booth.hours}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 추가 안내 */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border border-purple-400/30 rounded-xl">
            <p className="text-purple-100 text-center leading-relaxed">
              💡 운영 시간은 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="pb-16"></div>
    </main>
  );
}
