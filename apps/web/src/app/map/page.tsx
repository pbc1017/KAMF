import Link from 'next/link';

// 지도 구역 정보
const mapAreas = [
  {
    id: 'stage',
    nameKr: '무대',
    nameEn: 'Stage',
    url: '/stage',
    available: false,
    position: 'top-8 left-1/2 transform -translate-x-1/2',
    color: 'bg-purple-500',
  },
  {
    id: 'info',
    nameKr: '안내',
    nameEn: 'Info',
    url: '/map/info',
    available: true,
    position: 'top-20 right-8',
    color: 'bg-blue-500',
  },
  {
    id: 'booth',
    nameKr: '부스',
    nameEn: 'Booth',
    url: '/map/booth',
    available: true,
    position: 'top-1/2 left-8 transform -translate-y-1/2',
    color: 'bg-green-500',
  },
  {
    id: 'food',
    nameKr: '푸드',
    nameEn: 'Food',
    url: '/map/food-truck',
    available: true,
    position: 'top-1/2 right-8 transform -translate-y-1/2',
    color: 'bg-orange-500',
  },
  {
    id: 'hof',
    nameKr: '호프',
    nameEn: 'Hof',
    url: '/map/hof',
    available: true,
    position: 'bottom-8 left-1/2 transform -translate-x-1/2',
    color: 'bg-yellow-500',
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
    zone: '호프존',
    hours: '17:00 - 24:00',
    description: '주류 및 안주 판매',
    status: 'open',
  },
  {
    zone: '무대',
    hours: '14:00 - 21:00',
    description: '공연 및 이벤트',
    status: 'preparing',
  },
];

export default function MapPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">KAMF 축제 지도</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">원하는 구역을 선택해주세요</p>
      </div>

      {/* 지도 컨테이너 */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative w-full h-96 md:h-[500px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-gray-200 dark:border-gray-700">
          {/* 지도 배경 패턴 */}
          <div className="absolute inset-4 bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl opacity-30"></div>

          {/* 구역 버튼들 */}
          {mapAreas.map(area => (
            <div key={area.id} className={`absolute ${area.position}`}>
              {area.available ? (
                <Link href={area.url}>
                  <button
                    className={`
                      ${area.color} text-white font-bold py-4 px-6 rounded-2xl shadow-lg
                      transform transition-all duration-300
                      border-2 border-white dark:border-gray-200
                      min-w-[100px] md:min-w-[120px]
                    `}
                  >
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold">{area.nameKr}</div>
                      <div className="text-xs md:text-sm opacity-90">{area.nameEn}</div>
                    </div>
                  </button>
                </Link>
              ) : (
                <button
                  className="
                    bg-gray-400 text-gray-200 font-bold py-4 px-6 rounded-2xl shadow-lg
                    border-2 border-white dark:border-gray-200 cursor-not-allowed
                    min-w-[100px] md:min-w-[120px] opacity-60
                  "
                  disabled
                >
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-bold">{area.nameKr}</div>
                    <div className="text-xs md:text-sm opacity-90">{area.nameEn}</div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 부스별 운영 시간 */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            부스별 운영 시간
          </h3>
          <div className="space-y-4">
            {operatingHours.map((booth, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booth.zone}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booth.status === 'open'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {booth.status === 'open' ? '운영중' : '준비중'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {booth.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {booth.hours}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 추가 안내 */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              💡 운영 시간은 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="pb-12"></div>
    </main>
  );
}
