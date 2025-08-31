import Link from 'next/link';

const mainNavigation = [
  {
    title: '부스',
    url: '/booth',
  },
  {
    title: '야시장',
    url: '/map/night-market',
  },
  {
    title: '공연',
    url: '/stages',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative bg-home-image">
      <div className="relative z-10 flex justify-center items-start min-h-screen">
        <div className="flex flex-col gap-4 mt-[300px]">
          {mainNavigation.map((nav, index) => (
            <Link key={index} href={nav.url}>
              <button className="text-white text-2xl font-bold hover:text-gray-300 transition-colors duration-300 px-6 py-3">
                {nav.title}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
