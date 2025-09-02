'use client';

import { ReactNode } from 'react';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CountButtonProps {
  type: 'in' | 'out';
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export default function CountButton({
  type,
  onClick,
  isLoading = false,
  disabled = false,
  children,
  className = '',
}: CountButtonProps) {
  const baseClasses =
    'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none';

  const typeClasses = {
    in: 'bg-green-600 hover:bg-green-700 focus:ring-green-300 text-white shadow-lg hover:shadow-xl',
    out: 'bg-red-600 hover:bg-red-700 focus:ring-red-300 text-white shadow-lg hover:shadow-xl',
  };

  const sizeClasses = 'py-6 px-8 text-2xl min-h-[120px] flex flex-col items-center justify-center';

  const disabledState = disabled || isLoading;

  const buttonClasses = `
    ${baseClasses}
    ${typeClasses[type]}
    ${sizeClasses}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabledState}
      className={buttonClasses}
      aria-label={`${type === 'in' ? '입장' : '퇴장'} 카운트 ${isLoading ? '처리 중' : '버튼'}`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <LoadingSpinner size="md" color="white" />
          <span className="text-sm mt-2">처리 중...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="text-3xl mb-1">
            {type === 'in' ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            )}
          </div>
          {children}
        </div>
      )}
    </button>
  );
}
