import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { getTodayStagesUrl } from '@/utils/stages';

export default async function Home() {
  const t = await getTranslations('home');
  const common = await getTranslations('common');
  const nav = await getTranslations('nav');
  const operatingHoursT = await getTranslations('operatingHours');

  // 한국 시간 기준 현재 시간 구하기
  const getCurrentKoreanTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  };

  // 현재 시간이 운영시간 내인지 확인
  const isCurrentlyOpen = (operatingHours: string): boolean => {
    const koreanTime = getCurrentKoreanTime();
    const currentHour = koreanTime.getHours();
    const currentMinute = koreanTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [start, end] = operatingHours.split(' - ');
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    let endTimeInMinutes = endHour * 60 + endMinute;

    // 24:00 처리 (자정)
    if (endHour === 24) {
      endTimeInMinutes = 24 * 60;
    }

    // 자정을 넘어가는 경우 (예: 17:00 - 24:00)
    if (endTimeInMinutes >= 24 * 60) {
      return currentTimeInMinutes >= startTimeInMinutes;
    }

    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  // 부스별 운영 시간 정보 (실시간 상태 계산)
  const operatingHoursData = [
    {
      zone: operatingHoursT('boothZone'),
      hours: '13:00 - 18:00',
      description: operatingHoursT('descriptions.booth'),
      status: isCurrentlyOpen('13:00 - 18:00') ? 'open' : 'closed',
    },
    {
      zone: operatingHoursT('infoDesk'),
      hours: '13:00 - 22:30',
      description: operatingHoursT('descriptions.info'),
      status: isCurrentlyOpen('13:00 - 22:30') ? 'open' : 'closed',
    },
    {
      zone: operatingHoursT('foodTruck'),
      hours: '13:00 - 22:30',
      description: operatingHoursT('descriptions.foodTruck'),
      status: isCurrentlyOpen('13:00 - 22:30') ? 'open' : 'closed',
    },
    {
      zone: operatingHoursT('nightMarket'),
      hours: '18:00 - 22:30',
      description: operatingHoursT('descriptions.nightMarket'),
      status: isCurrentlyOpen('18:00 - 22:30') ? 'open' : 'closed',
    },
    {
      zone: operatingHoursT('stageZone'),
      hours: '15:00 - 22:00',
      description: operatingHoursT('descriptions.stage'),
      status: isCurrentlyOpen('15:00 - 22:00') ? 'open' : 'closed',
    },
  ];
  const mainNavigation = [
    {
      title: nav('boothMap'),
      url: '/booth',
    },
    {
      title: nav('stageSchedule'),
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
          <p className="text-2xl text-purple-200 font-medium">{common('subtitle')}</p>
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
            <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
              {mainNavigation.map((nav, index) => (
                <Link key={index} href={nav.url}>
                  <button className="w-full py-4 px-8 bg-gradient-to-r from-purple-700/40 to-indigo-700/40 hover:from-purple-600/60 hover:to-indigo-600/60 backdrop-blur-sm border border-purple-400/30 hover:border-purple-300/50 rounded-xl transition-all duration-300 text-xl font-bold text-white hover:scale-105 text-center">
                    {nav.title}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 부스별 운영 시간 */}
        <div className="card-purple rounded-3xl shadow-2xl p-8 mb-16">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">{t('operatingHours')}</h3>
          <div className="space-y-4">
            {operatingHoursData.map((booth, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-gradient-to-r from-purple-800/20 to-indigo-800/20 backdrop-blur-sm border border-purple-500/20 rounded-xl hover:border-purple-400/30 transition-all duration-300"
              >
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <h4 className="text-lg md:text-xl font-semibold text-white break-words">
                      {booth.zone}
                    </h4>
                    <span
                      className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full ${
                        booth.status === 'open'
                          ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-200 border border-green-400/30'
                          : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200 border border-yellow-400/30'
                      }`}
                    >
                      {booth.status === 'open' ? common('open') : common('closed')}
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm md:text-base break-words">
                    {booth.description}
                  </p>
                </div>
                <div className="text-center md:text-right md:ml-6 mt-2 md:mt-0">
                  <div className="text-lg md:text-xl font-bold text-white">{booth.hours}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 추가 안내 */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border border-purple-400/30 rounded-xl">
            <p className="text-purple-100 text-center leading-relaxed">💡 {t('notice')}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
