import Link from 'next/link';

// 지도 구역 정보 (map 페이지에서 가져옴)
const mapAreas = [
  {
    id: 'stage',
    nameKr: '무대',
    nameEn: 'Stage',
    url: '/stages',
    available: true,
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
    url: '/map/foodTruck',
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

// 부스별 운영 시간 정보 (map 페이지에서 가져옴)
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
    status: 'open',
  },
];

// 메인 네비게이션 버튼들
const mainNavigation = [
  {
    title: '무대 프로그램',
    description: '다양한 공연과 이벤트 일정을 확인하세요',
    url: '/stages',
    icon: '🎭',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: '상세 지도',
    description: '축제 구역별 상세 정보와 위치를 확인하세요',
    url: '/map',
    icon: '🗺️',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: '부스 목록',
    description: '다양한 부스와 체험존 정보를 둘러보세요',
    url: '/booth',
    icon: '🏪',
    color: 'bg-green-500 hover:bg-green-600',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 섹션 */}
      <div className="text-center py-12 px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          KAMF <span className="text-blue-600">2025</span>
        </h1>
        <p className="text-xl text-gray-600 mb-2">Korea Arts & Music Festival</p>
        <p className="text-lg text-gray-500">
          📅 2025년 5월 17일(토) - 18일(일) | 📍 대학교 캠퍼스
        </p>
        <div className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          🎉 축제가 진행 중입니다!
        </div>
      </div>

      {/* 축제 지도 섹션 */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">축제 지도</h2>
          <p className="text-gray-600">원하는 구역을 터치하여 상세 정보를 확인하세요</p>
        </div>

        <div className="relative w-full h-96 md:h-[400px] bg-white rounded-3xl shadow-2xl border-4 border-gray-200">
          {/* 지도 배경 패턴 */}
          <div className="absolute inset-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl opacity-30"></div>

          {/* 구역 버튼들 */}
          {mapAreas.map(area => (
            <div key={area.id} className={`absolute ${area.position}`}>
              <Link href={area.url}>
                <button
                  className={`
                    ${area.color} text-white font-bold py-3 px-5 rounded-2xl shadow-lg
                    transform transition-all duration-300 hover:scale-105
                    border-2 border-white
                    min-w-[90px] md:min-w-[110px]
                  `}
                >
                  <div className="text-center">
                    <div className="text-base md:text-lg font-bold">{area.nameKr}</div>
                    <div className="text-xs opacity-90">{area.nameEn}</div>
                  </div>
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 메인 네비게이션 섹션 */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">축제 둘러보기</h2>
          <p className="text-gray-600">관심 있는 카테고리를 선택해보세요</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {mainNavigation.map((nav, index) => (
            <Link key={index} href={nav.url}>
              <div
                className={`
                ${nav.color} text-white rounded-2xl shadow-lg p-6
                transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                cursor-pointer
              `}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{nav.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{nav.title}</h3>
                  <p className="text-sm opacity-90">{nav.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 운영시간 섹션 */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">구역별 운영시간</h3>
          <div className="space-y-4">
            {operatingHours.map((booth, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-semibold text-gray-900">{booth.zone}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booth.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booth.status === 'open' ? '운영중' : '준비중'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{booth.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900">{booth.hours}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 추가 안내 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              �� 운영 시간은 상황에 따라 변경될 수 있습니다. 현장 안내데스크에서 최신 정보를
              확인해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 공지사항 */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-2xl shadow-lg p-6 text-center">
          <h3 className="text-xl font-bold mb-2">🎪 KAMF 2025에 오신 것을 환영합니다!</h3>
          <p className="text-sm opacity-90">
            안전하고 즐거운 축제를 위해 마스크 착용과 개인 위생수칙을 준수해주세요.
          </p>
        </div>
      </div>
    </main>
  );
}
