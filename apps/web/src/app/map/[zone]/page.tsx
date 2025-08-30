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
  [Zone.HOF]: {
    nameKr: '호프존',
    nameEn: 'Hof Zone',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop',
    bgGradient: 'from-violet-600 to-purple-600',
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
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-purple-organic organic-overlay">
        <div className="card-purple p-12 text-center rounded-3xl">
          <h1 className="text-4xl font-bold text-red-400 mb-4">잘못된 Zone입니다</h1>
          <p className="text-purple-200">유효한 zone: booth, info, food-truck, hof</p>
        </div>
      </main>
    );
  }

  const currentZoneInfo = zoneInfo[zone];
  const currentBooths = mockBooths[zone] || [];

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
