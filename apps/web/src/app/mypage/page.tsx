'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useMe, useUpdateMe } from '@/hooks/useUser';
import { useAuth } from '@/providers/AuthProvider';

export default function MyPage() {
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  // 사용자 정보 조회
  const { data: userResponse } = useMe();
  const updateMeMutation = useUpdateMe();

  useEffect(() => {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // 사용자 정보 로드 시 displayName 설정
    if (userResponse?.user.displayName) {
      setDisplayName(userResponse.user.displayName);
    }
  }, [isAuthenticated, authLoading, router, userResponse]);

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
    if (userResponse?.user.displayName) {
      setDisplayName(userResponse.user.displayName);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까?')) {
      logout();
    }
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
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
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  placeholder="닉네임을 입력하세요"
                  maxLength={20}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={updateMeMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-xl transition duration-200"
                  >
                    {updateMeMutation.isPending ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updateMeMutation.isPending}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-2 px-4 rounded-xl transition duration-200"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-900 font-medium">{displayName || '닉네임 없음'}</p>
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
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
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
          </button>
        </div>
      </div>
    </div>
  );
}
