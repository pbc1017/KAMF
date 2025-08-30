'use client';

import { FestivalDay, StageWithDay } from '@kamf/interface/types/festival.js';
import { useState } from 'react';

import { SegmentControl } from '@/components/SegmentControl';
import { StageCard } from '@/components/StageCard';

// 샘플 데이터
const mockStages: StageWithDay[] = [
  // Saturday stages
  {
    id: 1,
    titleKo: '개막식',
    titleEn: 'Opening Ceremony',
    startTime: '10:00',
    endTime: '10:30',
    descriptionKo: 'KAMF 2025 축제의 시작을 알리는 개막식입니다. 모든 참가자들을 환영합니다.',
    descriptionEn: 'The opening ceremony of KAMF 2025, welcoming all participants.',
    day: FestivalDay.SATURDAY,
  },
  {
    id: 2,
    titleKo: '밴드 공연 - 록 스피릿',
    titleEn: 'Band Performance - Rock Spirit',
    startTime: '11:00',
    endTime: '12:00',
    descriptionKo: '젊은 에너지가 넘치는 록 밴드의 열정적인 공연입니다.',
    descriptionEn: 'An energetic performance by a rock band with young energy.',
    day: FestivalDay.SATURDAY,
  },
  {
    id: 3,
    titleKo: '어쿠스틱 세션',
    titleEn: 'Acoustic Session',
    startTime: '14:00',
    endTime: '15:30',
    descriptionKo: '감성적인 어쿠스틱 기타와 보컬이 어우러진 따뜻한 음악 시간입니다.',
    descriptionEn: 'A warm acoustic guitar and vocal session that blends emotions.',
    day: FestivalDay.SATURDAY,
  },
  {
    id: 4,
    titleKo: 'DJ 퍼포먼스',
    titleEn: 'DJ Performance',
    startTime: '16:00',
    endTime: '17:30',
    descriptionKo: '최신 K-POP과 EDM이 만나는 흥겨운 DJ 무대입니다.',
    descriptionEn: 'A fun DJ performance with the latest K-POP and EDM.',
    day: FestivalDay.SATURDAY,
  },
  {
    id: 5,
    titleKo: '토요일 메인 콘서트',
    titleEn: 'Saturday Main Concert',
    startTime: '19:00',
    endTime: '21:00',
    descriptionKo: '토요일의 하이라이트! 유명 아티스트들의 화려한 무대가 펼쳐집니다.',
    descriptionEn: 'The highlight of Saturday! A dazzling stage with famous artists.',
    day: FestivalDay.SATURDAY,
  },
  // Sunday stages
  {
    id: 6,
    titleKo: '모닝 재즈 카페',
    titleEn: 'Morning Jazz Cafe',
    startTime: '10:30',
    endTime: '11:30',
    descriptionKo: '일요일 아침을 여는 부드러운 재즈 선율과 함께하는 시간입니다.',
    descriptionEn: 'A warm jazz session that opens the Sunday morning.',
    day: FestivalDay.SUNDAY,
  },
  {
    id: 7,
    titleKo: '클래식 앙상블',
    titleEn: 'Classical Ensemble',
    startTime: '12:00',
    endTime: '13:00',
    descriptionKo: '우아하고 품격 있는 클래식 음악 연주회입니다.',
    descriptionEn: 'A classical music performance with elegance and refinement.',
    day: FestivalDay.SUNDAY,
  },
  {
    id: 8,
    titleKo: '인디 뮤직 쇼케이스',
    titleEn: 'Indie Music Showcase',
    startTime: '14:30',
    endTime: '16:00',
    descriptionKo: '개성 넘치는 인디 아티스트들의 특별한 무대를 만나보세요.',
    descriptionEn: 'A special stage with indie artists who stand out.',
    day: FestivalDay.SUNDAY,
  },
  {
    id: 9,
    titleKo: '트로트 가요제',
    titleEn: 'Trot Festival',
    startTime: '16:30',
    endTime: '18:00',
    descriptionKo: '남녀노소 모두가 함께 즐길 수 있는 트로트 가요 무대입니다.',
    descriptionEn: 'A trot festival where everyone can enjoy.',
    day: FestivalDay.SUNDAY,
  },
  {
    id: 10,
    titleKo: '폐막 콘서트',
    titleEn: 'Closing Concert',
    startTime: '19:30',
    endTime: '21:30',
    descriptionKo: 'KAMF 2025의 마지막을 장식하는 감동적인 폐막 콘서트입니다.',
    descriptionEn: 'An emotional closing concert that decorates the end of KAMF 2025.',
    day: FestivalDay.SUNDAY,
  },
];

export default function StagesPage() {
  const [selectedDay, setSelectedDay] = useState<FestivalDay>(FestivalDay.SATURDAY);

  // 선택된 날짜에 해당하는 공연 필터링 및 시간순 정렬
  const filteredStages = mockStages
    .filter(stage => stage.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">무대 프로그램</h1>
          <p className="text-gray-600">KAMF 2025의 다양한 공연 일정을 확인해보세요</p>
        </div>

        {/* 날짜 선택 */}
        <div className="mb-8">
          <SegmentControl selectedDay={selectedDay} onDayChange={setSelectedDay} />
        </div>

        {/* 공연 목록 */}
        <div className="space-y-4">
          {filteredStages.length > 0 ? (
            filteredStages.map(stage => <StageCard key={stage.id} stage={stage} />)
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">해당 날짜에 예정된 공연이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">공연 안내</h3>
            <p className="text-blue-700 text-sm">
              모든 공연은 날씨나 현장 상황에 따라 변경될 수 있습니다.
              <br />
              최신 정보는 현장 안내데스크에서 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
