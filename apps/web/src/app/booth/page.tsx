'use client';

import { Booth, Zone } from '@kamf/interface/types/festival.js';
import { useState, useMemo } from 'react';

import { BoothCard } from '@/components/BoothCard';
import { SearchBar } from '@/components/SearchBar';

// 샘플 부스 데이터
const sampleBooths: Booth[] = [
  {
    id: 1,
    titleKo: 'KAMF 굿즈샵',
    titleEn: 'KAMF Merchandise Shop',
    zone: Zone.BOOTH,
    descriptionKo:
      '공식 KAMF 굿즈와 기념품을 판매하는 부스입니다. 티셔츠, 스티커, 뱃지 등 다양한 아이템을 만나보세요.',
    descriptionEn:
      'A booth selling official KAMF merchandise and souvenirs. You can find various items like t-shirts, stickers, and badges.',
  },
  {
    id: 2,
    titleKo: '동아리 체험존',
    titleEn: 'Club Experience Zone',
    zone: Zone.BOOTH,
    descriptionKo:
      '다양한 동아리들의 활동을 체험해볼 수 있는 공간입니다. 로봇공학, 댄스, 밴드 등 흥미로운 체험이 준비되어 있습니다.',
    descriptionEn:
      'A space where you can experience various club activities. You can experience interesting activities like robotics, dance, and band.',
  },
  {
    id: 3,
    titleKo: '종합 안내소',
    titleEn: 'Information Center',
    zone: Zone.INFO,
    descriptionKo: '축제 전반에 대한 정보 제공과 분실물 접수, 응급처치 등의 서비스를 제공합니다.',
    descriptionEn:
      'We provide information about the festival, lost and found services, and first aid services.',
  },
  {
    id: 4,
    titleKo: '타코 트럭',
    titleEn: 'Taco Truck',
    zone: Zone.FOOD_TRUCK,
    descriptionKo: '신선한 재료로 만든 멕시칸 타코와 부리또를 판매합니다. 매콤달콤한 맛이 일품!',
    descriptionEn:
      'We sell delicious tacos and burritos made with fresh ingredients. The spicy and delicious taste is a must-try!',
  },
  {
    id: 5,
    titleKo: '버거 & 프라이',
    titleEn: 'Burger & Fries',
    zone: Zone.FOOD_TRUCK,
    descriptionKo: '수제 패티로 만든 맛있는 햄버거와 바삭한 감자튀김을 즐길 수 있습니다.',
    descriptionEn: 'You can enjoy delicious burgers and crispy fries made with homemade patties.',
  },
  {
    id: 6,
    titleKo: '아이스크림 카트',
    titleEn: 'Ice Cream Cart',
    zone: Zone.FOOD_TRUCK,
    descriptionKo:
      '더운 날씨에 시원한 아이스크림으로 달콤한 휴식을 취해보세요. 다양한 맛이 준비되어 있습니다.',
    descriptionEn:
      'Enjoy a refreshing ice cream in the hot weather. There are various flavors prepared.',
  },
  {
    id: 7,
    titleKo: '야시장 라운지',
    titleEn: 'Night Market Lounge',
    zone: Zone.NIGHT_MARKET,
    descriptionKo: '축제의 하이라이트! 시원한 맥주와 치킨으로 친구들과 즐거운 시간을 보내세요.',
    descriptionEn:
      'The highlight of the festival! Enjoy refreshing beer and chicken with your friends.',
  },
  {
    id: 8,
    titleKo: '게임 체험존',
    titleEn: 'Gaming Zone',
    zone: Zone.BOOTH,
    descriptionKo: '최신 VR 게임부터 클래식 아케이드까지! 다양한 게임을 무료로 체험할 수 있습니다.',
    descriptionEn:
      'Experience various games from the latest VR games to classic arcade games for free.',
  },
  {
    id: 9,
    titleKo: '포토존',
    titleEn: 'Photo Zone',
    zone: Zone.BOOTH,
    descriptionKo:
      '인스타그램 감성 가득한 포토존에서 친구들과 멋진 추억을 남겨보세요. 다양한 배경과 소품이 준비되어 있습니다.',
    descriptionEn:
      'Enjoy a photo zone with Instagram-style atmosphere. There are various backgrounds and props prepared.',
  },
  {
    id: 10,
    titleKo: '의료진 부스',
    titleEn: 'Medical Booth',
    zone: Zone.INFO,
    descriptionKo:
      '응급상황 대비 의료진이 상주하는 부스입니다. 간단한 상처 치료와 응급처치가 가능합니다.',
    descriptionEn:
      'A booth with medical staff for emergency situations. Simple wound treatment and first aid are possible.',
  },
];

export default function BoothListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<Zone | 'all'>('all');

  const filteredBooths = useMemo(() => {
    return sampleBooths.filter(booth => {
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
  }, [searchQuery, selectedZone]);

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="animate-float">
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

        {/* 부스 리스트 */}
        {filteredBooths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooths.map(booth => (
              <BoothCard key={booth.id} booth={booth} searchQuery={searchQuery} />
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
    </main>
  );
}
