'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import LanguageSwitcher from './LanguageSwitcher';

import { useAuth } from '@/providers/AuthProvider';
import { getTodayStagesUrl } from '@/utils/stages';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const t = useTranslations('nav');
  const common = useTranslations('common');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  // SAFETY 역할 확인
  const hasSafetyRole = user?.roles?.includes('safety') || false;

  // 기본 네비게이션 아이템
  const basicNavigationItems = [
    {
      title: t('boothMap'),
      url: '/booth',
    },
    {
      title: t('stageSchedule'),
      url: getTodayStagesUrl(),
    },
  ];

  // 네비게이션 아이템 생성
  const navigationItems = [
    ...basicNavigationItems,
    ...(isAuthenticated
      ? [
          // SAFETY 역할을 가진 사용자에게만 안전 관리 메뉴 표시
          ...(hasSafetyRole
            ? [
                {
                  title: t('safetyManagement'),
                  url: '/safety',
                },
              ]
            : []),
          {
            title: t('mypage'),
            url: '/mypage',
          },
        ]
      : [
          {
            title: t('login'),
            url: '/login',
          },
        ]),
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 로고 */}
            <div className="flex-1" />
            <Link href="/" className="flex-shrink-0 my-1" onClick={closeMenu}>
              <Image
                src="/kamf_logo.png"
                alt="KAMF 2025"
                width={100}
                height={30}
                className="object-contain hover:scale-105 transition-transform duration-300"
                draggable={false}
              />
            </Link>

            {/* 언어 전환기 및 햄버거 메뉴 버튼 */}
            <div className="flex-1 flex justify-end items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={toggleMenu}
                className="relative w-10 h-10 flex flex-col justify-center items-center space-y-1 bg-white hover:bg-violet-500 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg group"
                aria-label={t('openMenu')}
              >
                <span
                  className={`block w-6 h-0.5 bg-black group-hover:bg-white transition-all duration-300 ${
                    isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span
                  className={`block w-6 h-0.5 bg-black group-hover:bg-white transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block w-6 h-0.5 bg-black group-hover:bg-white transition-all duration-300 ${
                    isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 오버레이 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 사이드 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full bg-gray-900/95 backdrop-blur-xl border-l border-gray-700 shadow-2xl">
          {/* 메뉴 헤더 */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">{t('menu')}</h2>
            <button
              onClick={closeMenu}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-600/20 hover:bg-violet-500 transition-colors duration-200"
              aria-label={t('closeMenu')}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 사용자 정보 (로그인된 경우) */}
          {isAuthenticated && user && (
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {user.displayName || common('newUser')}
                  </p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* 메뉴 항목들 */}
          <nav className="p-6">
            {/* 로딩 중일 때 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="ml-2 text-white">{common('loading')}</span>
              </div>
            ) : (
              <ul className="space-y-4">
                {navigationItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.url}
                      onClick={closeMenu}
                      className="block w-full text-left p-4 text-lg font-semibold text-black bg-white hover:bg-violet-500 hover:text-white rounded-2xl border border-gray-300 hover:border-violet-500 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}

                {/* 로그아웃 버튼 (로그인된 경우) */}
                {isAuthenticated && (
                  <li>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left p-4 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 rounded-2xl border border-red-500 hover:border-red-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                    >
                      {t('logout')}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </nav>

          {/* 하단 정보 */}
          <div className="absolute bottom-6 left-6 right-6 text-center">
            <div className="p-4 bg-gray-800/20 rounded-2xl border border-gray-700">
              <p className="text-violet-400 text-sm font-semibold">{common('title')}</p>
              <p className="text-gray-300 text-xs mt-1">{common('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
