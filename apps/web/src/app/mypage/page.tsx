'use client';

import { useEffect, useState } from 'react';

import Button, { DangerButton, SecondaryButton } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FullScreenLoading } from '@/components/ui/LoadingSpinner';
import { useRequireAuth } from '@/hooks/useAuthGuard';
import { useUpdateMe } from '@/hooks/useUser';
import { useAuth } from '@/providers/AuthProvider';

export default function MyPage() {
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 인증 가드: 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  const { isLoading: authGuardLoading } = useRequireAuth();
  const { user, logout } = useAuth();
  const updateMeMutation = useUpdateMe();

  useEffect(() => {
    // AuthProvider의 사용자 정보로 displayName 설정
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleUpdateDisplayName = () => {
    if (!displayName.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    updateMeMutation.mutate(
      { displayName: displayName.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
          alert('닉네임이 성공적으로 변경되었습니다.');
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
              : '닉네임 변경에 실패했습니다.';
          alert(errorMessage);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 원래 값으로 복원
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까?')) {
      logout();
    }
  };

  // 인증 확인 중인 경우 로딩 표시
  if (authGuardLoading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-md mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
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
          <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
        </div>

        {/* 사용자 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">내 정보</h2>

          {/* 전화번호 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-900 font-medium">{user?.phoneNumber}</p>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  maxLength={20}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdateDisplayName}
                    isLoading={updateMeMutation.isPending}
                    className="flex-1"
                  >
                    저장
                  </Button>
                  <SecondaryButton
                    onClick={handleCancelEdit}
                    disabled={updateMeMutation.isPending}
                    className="flex-1"
                  >
                    취소
                  </SecondaryButton>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-900 font-medium">
                  {displayName || '로그인 후 자동 생성된 닉네임입니다'}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  변경
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          <DangerButton
            onClick={handleLogout}
            fullWidth
            className="flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>로그아웃</span>
          </DangerButton>
        </div>
      </div>
    </div>
  );
}
