'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, text, url, className = '' }: ShareButtonProps) {
  const t = useTranslations('share');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // Web Share API가 지원되는 경우 우선 사용
      if (navigator.share && navigator.canShare) {
        const shareData = { title, text, url };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          // Web Share API는 성공 시 별도 토스트 불필요 (시스템 UI 사용)
          return;
        }
      }

      // Clipboard API fallback
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success(t('shareSuccess'));
      } else {
        // Legacy fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          toast.success(t('shareSuccess'));
        } catch (err) {
          throw new Error('Copy command failed');
        } finally {
          textArea.remove();
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error(t('shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`
        group relative flex items-center justify-center
        w-10 h-10 rounded-lg
        bg-white/10 backdrop-blur-sm border border-white/20
        text-white/80 hover:text-white
        hover:bg-white/20 hover:border-white/30
        active:scale-95
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={t('shareButton')}
      aria-label={t('shareButton')}
    >
      {/* 공유 아이콘 (외부 화살표 스타일) */}
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${
          isSharing ? 'animate-pulse' : 'group-hover:scale-110'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
        />
      </svg>

      {/* 호버 시 툴팁 효과 */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-black/80 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap backdrop-blur-sm">
          {t('shareButton')}
          {/* 툴팁 화살표 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
        </div>
      </div>
    </button>
  );
}
