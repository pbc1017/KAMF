import React, { useState, useEffect, useRef } from 'react';

import Button from '@/components/ui/Button';

interface VerificationCodeFormProps {
  email: string;
  onVerifyCode: (code: string) => void;
  onBackToEmail: () => void;
  onResendCode: () => void;
  isLoading: boolean;
  isResending?: boolean;
}

export default function VerificationCodeForm({
  email,
  onVerifyCode,
  onBackToEmail,
  onResendCode,
  isLoading,
  isResending = false,
}: VerificationCodeFormProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180); // 3분 = 180초
  const [isExpired, setIsExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // 첫 번째 입력창에 포커스
    inputRefs.current[0]?.focus();

    // 3분 타이머 시작
    startTimer();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setTimeLeft(180);
    setIsExpired(false);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    setCode(['', '', '', '', '', '']);
    startTimer();
    onResendCode();
    inputRefs.current[0]?.focus();
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // 숫자만 허용

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // 다음 입력창으로 이동
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6자리 모두 입력되면 자동 제출 (만료되지 않은 경우에만)
    if (newCode.every(digit => digit !== '') && !isLoading && !isExpired) {
      onVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onVerifyCode(fullCode);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newCode = [...code];
      digits.forEach((digit, index) => {
        if (index < 6) {
          newCode[index] = digit;
        }
      });
      setCode(newCode);

      // 마지막 입력된 위치로 포커스 이동
      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();

      // 6자리가 모두 채워졌으면 자동 제출 (만료되지 않은 경우에만)
      if (digits.length === 6 && !isLoading && !isExpired) {
        onVerifyCode(newCode.join(''));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 이메일 표시 */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
          <svg
            className="w-4 h-4 text-blue-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium text-blue-900">{email}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">위 이메일로 인증번호를 발송했습니다</p>

        {/* 타이머 표시 */}
        <div className="mt-3">
          {isExpired ? (
            <p className="text-sm text-red-600 font-medium">인증번호가 만료되었습니다</p>
          ) : (
            <p className="text-sm text-blue-600 font-medium">유효시간: {formatTime(timeLeft)}</p>
          )}
        </div>
      </div>

      {/* 인증번호 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
          인증번호 6자리
        </label>
        <div className="flex space-x-2 justify-center" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* 버튼들 */}
      <div className="space-y-3">
        <Button
          type="submit"
          disabled={code.some(digit => !digit) || isExpired}
          isLoading={isLoading}
          fullWidth
        >
          {isExpired ? '시간 만료' : '로그인'}
        </Button>

        {/* 재시도 버튼 */}
        {isExpired && (
          <Button
            type="button"
            onClick={handleResend}
            isLoading={isResending}
            fullWidth
            className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
          >
            인증번호 재발송
          </Button>
        )}

        <Button
          type="button"
          onClick={onBackToEmail}
          variant="secondary"
          fullWidth
          disabled={isLoading}
        >
          이메일 다시 입력
        </Button>
      </div>

      {/* 도움말 */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          인증번호가 오지 않나요?{' '}
          {!isExpired ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading || isResending}
            >
              재발송하기
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToEmail}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              이메일 변경
            </button>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-2">스팸함도 확인해보세요!</p>
      </div>
    </form>
  );
}
