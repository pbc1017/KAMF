'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

import { type Locale } from '@/i18n';

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // 쿠키 설정 (1년 유효)
      document.cookie = `KAMF_LOCALE=${newLocale}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=lax`;

      // 페이지 새로고침으로 언어 변경 적용
      window.location.reload();
    });

    setIsOpen(false);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const languages = [
    { code: 'ko' as Locale, name: '한국어', flag: '🇰🇷' },
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 지구본 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 border border-gray-600 hover:border-gray-500"
        disabled={isPending}
        aria-label="언어 선택"
      >
        {isPending ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            />
          </svg>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !isPending && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-gray-800 backdrop-blur-md border border-gray-600 rounded-lg shadow-xl z-50">
          {languages.map(language => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                locale === language.code
                  ? 'bg-purple-600 text-white border-l-2 border-purple-400'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-base">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
              {locale === language.code && (
                <svg
                  className="w-4 h-4 ml-auto text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
