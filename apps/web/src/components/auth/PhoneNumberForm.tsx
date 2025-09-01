import React from 'react';

import Button from '@/components/ui/Button';

interface PhoneNumberFormProps {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  onRequestCode: () => void;
  isLoading: boolean;
}

export default function PhoneNumberForm({
  phoneNumber,
  setPhoneNumber,
  onRequestCode,
  isLoading,
}: PhoneNumberFormProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');

    // 010-1234-5678 형태로 포맷팅
    if (value.length >= 4) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }
    if (value.length >= 9) {
      value = value.slice(0, 8) + '-' + value.slice(8, 12);
    }

    setPhoneNumber(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestCode();
  };

  const isValidPhone = phoneNumber.replace(/-/g, '').length === 11;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
        <div className="relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="010-1234-5678"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900 transition-all duration-200"
            maxLength={13}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
        </div>
        {phoneNumber && !isValidPhone && (
          <p className="mt-2 text-sm text-red-600">올바른 전화번호를 입력해주세요.</p>
        )}
      </div>

      <Button type="submit" disabled={!isValidPhone} isLoading={isLoading} fullWidth size="lg">
        인증번호 받기
      </Button>
    </form>
  );
}
