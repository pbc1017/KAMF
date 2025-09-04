'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import EmailForm from '@/components/auth/EmailForm';
import VerificationCodeForm from '@/components/auth/VerificationCodeForm';
import { FullScreenLoading } from '@/components/ui/LoadingSpinner';
import { useRequestCode, useVerifyCode } from '@/hooks/useAuth';
import { useRedirectIfAuthenticated } from '@/hooks/useAuthGuard';
import { useAuth } from '@/providers/AuthProvider';

type LoginStep = 'email' | 'code';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations('auth');

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  const { isLoading } = useRedirectIfAuthenticated();

  // 인증번호 요청 mutation
  const requestCodeMutation = useRequestCode();

  // 재시도를 위한 mutation (같은 hook 재사용)
  const resendCodeMutation = useRequestCode();

  // 인증번호 확인 & 로그인 mutation
  const verifyCodeMutation = useVerifyCode();

  const handleRequestCode = () => {
    if (!email.trim()) {
      alert(t('errors.emailRequired'));
      return;
    }

    requestCodeMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setStep('code');
        },
        onError: (error: unknown) => {
          const errorMessage =
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'data' in error.response &&
            error.response.data &&
            typeof error.response.data === 'object' &&
            'message' in error.response.data &&
            typeof error.response.data.message === 'string'
              ? error.response.data.message
              : t('errors.sendCodeFailed');
          alert(errorMessage);
        },
      }
    );
  };

  const handleResendCode = () => {
    resendCodeMutation.mutate(
      { email },
      {
        onSuccess: () => {
          // 재발송 성공 - alert 대신 자연스러운 UX
          console.log('인증번호가 재발송되었습니다.');
        },
        onError: (error: unknown) => {
          const errorMessage =
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'data' in error.response &&
            error.response.data &&
            typeof error.response.data === 'object' &&
            'message' in error.response.data &&
            typeof error.response.data.message === 'string'
              ? error.response.data.message
              : t('errors.resendFailed');
          alert(errorMessage);
        },
      }
    );
  };

  const handleVerifyCode = (code: string) => {
    if (!code.trim()) {
      alert(t('errors.codeRequired'));
      return;
    }

    verifyCodeMutation.mutate(
      { email, code },
      {
        onSuccess: response => {
          const { user, tokens } = response.data;
          login(tokens, user);
          router.push('/');
        },
        onError: (error: unknown) => {
          const errorMessage =
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'data' in error.response &&
            error.response.data &&
            typeof error.response.data === 'object' &&
            'message' in error.response.data &&
            typeof error.response.data.message === 'string'
              ? error.response.data.message
              : t('errors.invalidCode');
          alert(errorMessage);
        },
      }
    );
  };

  const handleBackToEmail = () => {
    setStep('email');
  };

  // 인증 확인 중에는 로딩 표시
  if (isLoading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login')}</h1>
            <p className="text-gray-600">
              {step === 'email' ? t('emailLogin') : t('enterVerificationCode')}
            </p>
          </div>

          {/* 폼 컨테이너 */}
          {step === 'email' ? (
            <EmailForm
              email={email}
              setEmail={setEmail}
              onRequestCode={handleRequestCode}
              isLoading={requestCodeMutation.isPending}
            />
          ) : (
            <VerificationCodeForm
              email={email}
              onVerifyCode={handleVerifyCode}
              onBackToEmail={handleBackToEmail}
              onResendCode={handleResendCode}
              isLoading={verifyCodeMutation.isPending}
              isResending={resendCodeMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
