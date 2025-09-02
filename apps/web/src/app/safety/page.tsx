'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { FullScreenLoading } from '@/components/ui/LoadingSpinner';
import { useRequireAuth } from '@/hooks/useAuthGuard';
import { useSafetyStats } from '@/hooks/useSafety';
import { useAuth } from '@/providers/AuthProvider';

export default function SafetyPage() {
  const router = useRouter();

  // 기본 인증 가드
  const { isLoading: authGuardLoading } = useRequireAuth();
  const { user, isLoading: userLoading } = useAuth();

  // Safety 통계 데이터 조회 (실시간 업데이트)
  const { data: stats, isLoading: statsLoading, error: statsError } = useSafetyStats();

  // SAFETY 역할 확인
  const hasSafetyRole = user?.roles?.includes('safety') || false;

  useEffect(() => {
    // 사용자 로딩이 완료되고 SAFETY 역할이 없으면 홈으로 리다이렉트
    if (!userLoading && !hasSafetyRole) {
      router.push('/');
    }
  }, [userLoading, hasSafetyRole, router]);

  // 로딩 상태 처리
  if (authGuardLoading || userLoading) {
    return <FullScreenLoading />;
  }

  // SAFETY 역할이 없는 경우
  if (!hasSafetyRole) {
    return <FullScreenLoading />; // 리다이렉트 중이므로 로딩 표시
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">안전 관리</h1>
          <p className="text-gray-600">실시간 인원 현황 및 안전 통계를 관리합니다</p>
        </div>

        {/* 통계 오류 표시 */}
        {statsError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-red-700 font-medium">
                통계 데이터를 불러오는 중 오류가 발생했습니다.
              </p>
            </div>
          </div>
        )}

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 현재 인원수 카드 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">현재 인원수</h2>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">로딩 중...</span>
                </div>
              ) : (
                <>
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {stats?.currentTotal ?? 0}
                  </div>
                  <p className="text-gray-500 text-lg">명</p>
                  {stats && (
                    <div className="mt-4 text-sm text-gray-400">
                      마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* In/Out 컨트롤 영역 (4단계에서 구현 예정) */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">인원 카운트</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* 임시 버튼들 - 4단계에서 실제 구현 */}
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-6 px-4 rounded-xl text-xl transition-colors duration-200">
                IN
                <div className="text-sm mt-1">입장</div>
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-6 px-4 rounded-xl text-xl transition-colors duration-200">
                OUT
                <div className="text-sm mt-1">퇴장</div>
              </button>
            </div>
            <div className="mt-4 text-center text-gray-500 text-sm">
              4단계에서 실제 기능이 구현됩니다
            </div>
          </div>

          {/* 오늘 통계 카드 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">오늘 통계</h3>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
                <span className="ml-2 text-gray-500">로딩 중...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">총 입장</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats?.todayStats.totalIncrement ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">총 퇴장</span>
                  <span className="text-2xl font-bold text-red-600">
                    {stats?.todayStats.totalDecrement ?? 0}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">현재 내부 인원</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats?.todayStats.currentInside ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 사용자 기여 통계 카드 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">내 기여 통계</h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
                  <span className="ml-2 text-gray-500">로딩 중...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {stats?.userStats.increment ?? 0}
                    </div>
                    <p className="text-gray-600">내가 센 입장</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {stats?.userStats.decrement ?? 0}
                    </div>
                    <p className="text-gray-600">내가 센 퇴장</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {stats?.userStats.netCount ?? 0}
                    </div>
                    <p className="text-gray-600">순 기여도</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 시간대별 차트 영역 (6단계에서 구현 예정) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">시간대별 통계</h3>
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-500">6단계에서 차트가 구현됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
