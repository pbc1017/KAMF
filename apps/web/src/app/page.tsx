import Image from 'next/image';
import Link from 'next/link';

import { getTodayStagesUrl } from '@/utils/stages';

export default function Home() {
  const mainNavigation = [
    {
      title: '지도',
      url: '/map',
    },
    {
      title: '부스',
      url: '/booth',
    },
    {
      title: '무대',
      url: getTodayStagesUrl(),
    },
  ];
  return (
    <main className="min-h-screen bg-black relative">
      <div className="relative z-10 flex justify-center items-start min-h-screen">
        <div className="flex flex-col gap-4 items-center">
          <Image
            src="/kamf_main.png"
            alt="KAMF 2025"
            width={400}
            height={400}
            className="object-contain"
            draggable={false}
          />
          {mainNavigation.map((nav, index) => (
            <Link key={index} href={nav.url}>
              <button className="text-white text-2xl font-bold hover:text-gray-300 transition-colors duration-300 px-4 py-3 border-b-2 border-white w-full">
                {nav.title}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
