import Image from 'next/image';
import Link from 'next/link';

import { getTodayStagesUrl } from '@/utils/stages';

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

export default function Home() {
  const mainNavigation = [
    {
      title: '부스 배치도',
      url: '/booth',
    },
    {
      title: '무대 시간표',
      url: getTodayStagesUrl(),
    },
  ];

  return (
    <main className="min-h-screen bg-purple-organic organic-overlay">
      {/* 헤더 */}
      <div className="text-center py-16">
        <div>
          <h1 className="text-6xl font-bold text-white mb-6">
            <span className="text-purple-gradient">KAMF</span> 2025
          </h1>
          <p className="text-2xl text-purple-200 font-medium">KAIST Art & Music Festival</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* 메인 로고 및 네비게이션 */}
        <div className="text-center mb-16">
          <div className="card-purple card-purple-hover rounded-3xl p-8 mb-12">
            <Image
              src="/kamf_main.png"
              alt="KAMF 2025"
              width={400}
              height={400}
              className="object-contain mx-auto mb-8"
              draggable={false}
            />
            <div className="flex flex-col gap-6">
              {mainNavigation.map((nav, index) => (
                <Link key={index} href={nav.url}>
                  <button className="py-4 px-8 bg-gradient-to-r from-purple-700/40 to-indigo-700/40 hover:from-purple-600/60 hover:to-indigo-600/60 backdrop-blur-sm border border-purple-400/30 hover:border-purple-300/50 rounded-xl transition-all duration-300 text-xl font-bold text-white hover:scale-105 min-w-fit whitespace-nowrap">
                    {nav.title}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 부스별 운영 시간 */}
        <div className="card-purple rounded-3xl shadow-2xl p-8 mb-16">
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
    </main>
  );
}
