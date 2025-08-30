import { Zone, Booth } from '@kamf/interface';

// URL 파라미터(케밥케이스) → Zone enum(카멜케이스) 변환
const urlToZone = (urlParam: string): Zone | null => {
  const mapping: Record<string, Zone> = {
    booth: Zone.BOOTH,
    info: Zone.INFO,
    'food-truck': Zone.FOOD_TRUCK,
    hof: Zone.HOF,
  };
  return mapping[urlParam] || null;
};

// Zone 정보 매핑
const zoneInfo = {
  [Zone.BOOTH]: {
    nameKr: '부스존',
    nameEn: 'Booth Zone',
    image: 'https://images.unsplash.com/photo-1541689221361-ad95003448db?w=800&h=400&fit=crop',
  },
  [Zone.INFO]: {
    nameKr: '안내소',
    nameEn: 'Information',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
  },
  [Zone.FOOD_TRUCK]: {
    nameKr: '푸드트럭',
    nameEn: 'Food Truck',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop',
  },
  [Zone.HOF]: {
    nameKr: '호프존',
    nameEn: 'Hof Zone',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
  },
};

// 임시 부스 데이터
const mockBooths: Record<Zone, Booth[]> = {
  [Zone.BOOTH]: [
    {
      id: 1,
      titleKo: '컴퓨터공학과 부스',
      titleEn: 'Computer Science Booth',
      zone: Zone.BOOTH,
      descriptionKo: '컴퓨터공학과에서 준비한 재미있는 프로그래밍 체험 부스입니다.',
      descriptionEn:
        'A booth with interesting programming experiences prepared by the Computer Science Department.',
    },
    {
      id: 2,
      titleKo: '경영학과 부스',
      titleEn: 'Business Administration Booth',
      zone: Zone.BOOTH,
      descriptionKo: '경영 시뮬레이션 게임을 체험해보세요!',
      descriptionEn: 'Experience the business simulation game!',
    },
    {
      id: 3,
      titleKo: '디자인학과 부스',
      titleEn: 'Design Department Booth',
      zone: Zone.BOOTH,
      descriptionKo: '창의적인 디자인 작품을 감상하고 체험할 수 있습니다.',
      descriptionEn: 'Enjoy the creative design works and experience them.',
    },
  ],
  [Zone.INFO]: [
    {
      id: 4,
      titleKo: '종합 안내소',
      titleEn: 'General Information',
      zone: Zone.INFO,
      descriptionKo: '축제 전반에 대한 안내를 받을 수 있습니다.',
      descriptionEn: 'You can get information about the entire festival.',
    },
    {
      id: 5,
      titleKo: '분실물 센터',
      titleEn: 'Lost & Found',
      zone: Zone.INFO,
      descriptionKo: '분실물 신고 및 찾기 서비스를 제공합니다.',
      descriptionEn: 'We provide lost and found services.',
    },
  ],
  [Zone.FOOD_TRUCK]: [
    {
      id: 6,
      titleKo: '한식 푸드트럭',
      titleEn: 'Korean Food Truck',
      zone: Zone.FOOD_TRUCK,
      descriptionKo: '맛있는 한식 요리를 판매합니다.',
      descriptionEn: 'We sell delicious Korean food.',
    },
    {
      id: 7,
      titleKo: '양식 푸드트럭',
      titleEn: 'Western Food Truck',
      zone: Zone.FOOD_TRUCK,
      descriptionKo: '버거, 파스타 등 양식 메뉴를 제공합니다.',
      descriptionEn: 'We provide Western food menus like burgers and pasta.',
    },
    {
      id: 8,
      titleKo: '디저트 푸드트럭',
      titleEn: 'Dessert Truck',
      zone: Zone.FOOD_TRUCK,
      descriptionKo: '달콤한 디저트와 음료를 판매합니다.',
      descriptionEn: 'We sell delicious desserts and drinks.',
    },
  ],
  [Zone.HOF]: [
    {
      id: 9,
      titleKo: '대학생 호프',
      titleEn: 'Student Pub',
      zone: Zone.HOF,
      descriptionKo: '대학생들을 위한 호프 및 안주를 판매합니다.',
      descriptionEn: 'We sell Hof and snacks for university students.',
    },
    {
      id: 10,
      titleKo: '치킨&맥주',
      titleEn: 'Chicken & Beer',
      zone: Zone.HOF,
      descriptionKo: '바삭한 치킨과 시원한 맥주의 조합!',
      descriptionEn: 'The combination of crispy chicken and refreshing beer!',
    },
  ],
};

export default function ZonePage({ params }: { params: { zone: string } }) {
  const zone = urlToZone(params.zone);

  if (!zone) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold text-red-500">잘못된 Zone입니다</h1>
        <p className="text-gray-600 mt-4">유효한 zone: booth, info, food-truck, hof</p>
      </main>
    );
  }

  const currentZoneInfo = zoneInfo[zone];
  const currentBooths = mockBooths[zone] || [];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Zone 제목 섹션 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {currentZoneInfo.nameKr}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">{currentZoneInfo.nameEn}</p>
          </div>
        </div>
      </div>

      {/* Zone 이미지 섹션 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-lg">
          <img
            src={currentZoneInfo.image}
            alt={`${currentZoneInfo.nameKr} 이미지`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      </div>

      {/* 부스 목록 섹션 */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          부스 목록
          <span className="block text-lg font-normal text-gray-600 dark:text-gray-400 mt-2">
            총 {currentBooths.length}개의 부스
          </span>
        </h2>

        <div className="space-y-6">
          {currentBooths.map(booth => (
            <div
              key={booth.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {booth.titleKo}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{booth.titleEn}</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {booth.descriptionKo}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    부스 #{booth.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentBooths.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              현재 이 구역에는 등록된 부스가 없습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
