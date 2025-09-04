'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import PhoneNumberForm from '@/components/auth/PhoneNumberForm';
import VerificationCodeForm from '@/components/auth/VerificationCodeForm';
import { FullScreenLoading } from '@/components/ui/LoadingSpinner';
import { useRequestCode, useVerifyCode } from '@/hooks/useAuth';
import { useRedirectIfAuthenticated } from '@/hooks/useAuthGuard';
import { useAuth } from '@/providers/AuthProvider';

type LoginStep = 'phone' | 'code';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  const { isLoading } = useRedirectIfAuthenticated();

  // 인증번호 요청 mutation
  const requestCodeMutation = useRequestCode();

  // 재시도를 위한 mutation (같은 hook 재사용)
  const resendCodeMutation = useRequestCode();

  // 인증번호 확인 & 로그인 mutation
  const verifyCodeMutation = useVerifyCode();

  const handleRequestCode = () => {
    if (!phoneNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    requestCodeMutation.mutate(
      { phoneNumber },
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
              : '인증번호 요청에 실패했습니다.';
          alert(errorMessage);
        },
      }
    );
  };

  const handleResendCode = () => {
    resendCodeMutation.mutate(
      { phoneNumber },
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
              : '인증번호 재발송에 실패했습니다.';
          alert(errorMessage);
        },
      }
    );
  };

  const handleVerifyCode = (code: string) => {
    if (!code.trim()) {
      alert('인증번호를 입력해주세요.');
      return;
    }

    verifyCodeMutation.mutate(
      { phoneNumber, code },
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
              : '인증번호가 올바르지 않습니다.';
          alert(errorMessage);
        },
      }
    );
  };

  const handleBackToPhone = () => {
    setStep('phone');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">
              {step === 'phone' ? '전화번호로 간편하게 로그인하세요' : '인증번호를 입력해주세요'}
            </p>
          </div>

          {/* 폼 컨테이너 */}
          {step === 'phone' ? (
            <PhoneNumberForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              onRequestCode={handleRequestCode}
              isLoading={requestCodeMutation.isPending}
            />
          ) : (
            <VerificationCodeForm
              phoneNumber={phoneNumber}
              onVerifyCode={handleVerifyCode}
              onBackToPhone={handleBackToPhone}
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
