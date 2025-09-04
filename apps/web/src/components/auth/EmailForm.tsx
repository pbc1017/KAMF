import { useTranslations } from 'next-intl';
import React from 'react';

import Button from '@/components/ui/Button';

interface EmailFormProps {
  email: string;
  setEmail: (email: string) => void;
  onRequestCode: () => void;
  isLoading: boolean;
}

export default function EmailForm({ email, setEmail, onRequestCode, isLoading }: EmailFormProps) {
  const t = useTranslations('auth');
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestCode();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValid = email.trim().length > 0 && isValidEmail(email);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailAddress')}</label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="example@kamf.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900 transition-all duration-200"
            disabled={isLoading}
            autoComplete="email"
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        {email && !isValidEmail(email) && (
          <p className="mt-2 text-sm text-red-600">{t('validEmailRequired')}</p>
        )}
      </div>

      <Button type="submit" disabled={!isValid} isLoading={isLoading} fullWidth size="lg">
        {t('getVerificationCode')}
      </Button>

      <div className="text-center text-sm text-gray-600">
        <p>{t('emailSentInfo')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('checkSpamFolder')}</p>
      </div>
    </form>
  );
}
