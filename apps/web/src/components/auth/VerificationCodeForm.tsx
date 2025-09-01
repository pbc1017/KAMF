import React, { useState, useEffect, useRef } from 'react';

interface VerificationCodeFormProps {
  phoneNumber: string;
  onVerifyCode: (code: string) => void;
  onBackToPhone: () => void;
  isLoading: boolean;
}

export default function VerificationCodeForm({
  phoneNumber,
  onVerifyCode,
  onBackToPhone,
  isLoading,
}: VerificationCodeFormProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // 첫 번째 입력창에 포커스
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // 숫자만 허용

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // 다음 입력창으로 이동
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6자리 모두 입력되면 자동 제출
    if (newCode.every(digit => digit !== '') && !isLoading) {
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

      // 6자리가 모두 채워졌으면 자동 제출
      if (digits.length === 6 && !isLoading) {
        onVerifyCode(newCode.join(''));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 전화번호 표시 */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
          <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="text-sm font-medium text-blue-900">{phoneNumber}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">위 번호로 인증번호를 발송했습니다</p>
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
        <button
          type="submit"
          disabled={isLoading || code.some(digit => !digit)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              인증 중...
            </div>
          ) : (
            '로그인'
          )}
        </button>

        <button
          type="button"
          onClick={onBackToPhone}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition duration-200"
          disabled={isLoading}
        >
          전화번호 다시 입력
        </button>
      </div>

      {/* 도움말 */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          인증번호가 오지 않나요?{' '}
          <button
            type="button"
            onClick={onBackToPhone}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={isLoading}
          >
            다시 요청하기
          </button>
        </p>
      </div>
    </form>
  );
}
