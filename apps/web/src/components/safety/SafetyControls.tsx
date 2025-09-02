'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import CountButton from './CountButton';

import { useSafetyStats, useUpdateSafetyCount } from '@/hooks/useSafety';

export default function SafetyControls() {
  const [lastAction, setLastAction] = useState<'in' | 'out' | null>(null);
  const { data: stats } = useSafetyStats();
  const updateCountMutation = useUpdateSafetyCount();

  // 현재 사용자의 카운트 정보
  const userStats = stats?.userStats || { increment: 0, decrement: 0, netCount: 0 };
  const isLoading = updateCountMutation.isPending;

  // In 버튼 클릭 핸들러
  const handleInClick = useCallback(() => {
    if (isLoading) return;

    setLastAction('in');
    const newIncrement = userStats.increment + 1;

    updateCountMutation.mutate(
      {
        increment: newIncrement,
        decrement: userStats.decrement,
      },
      {
        onSuccess: data => {
          toast.success(`입장 카운트 완료! 현재 ${data.currentTotal}명`, {
            icon: '✅',
            duration: 3000,
            position: 'top-center',
          });
          setLastAction(null);
        },
        onError: error => {
          console.error('In count update failed:', error);
          toast.error('입장 카운트에 실패했습니다. 다시 시도해주세요.', {
            icon: '❌',
            duration: 4000,
            position: 'top-center',
          });
          setLastAction(null);
        },
      }
    );
  }, [isLoading, userStats.increment, userStats.decrement, updateCountMutation]);

  // Out 버튼 클릭 핸들러
  const handleOutClick = useCallback(() => {
    if (isLoading) return;

    setLastAction('out');
    const newDecrement = userStats.decrement + 1;

    updateCountMutation.mutate(
      {
        increment: userStats.increment,
        decrement: newDecrement,
      },
      {
        onSuccess: data => {
          toast.success(`퇴장 카운트 완료! 현재 ${data.currentTotal}명`, {
            icon: '✅',
            duration: 3000,
            position: 'top-center',
          });
          setLastAction(null);
        },
        onError: error => {
          console.error('Out count update failed:', error);
          toast.error('퇴장 카운트에 실패했습니다. 다시 시도해주세요.', {
            icon: '❌',
            duration: 4000,
            position: 'top-center',
          });
          setLastAction(null);
        },
      }
    );
  }, [isLoading, userStats.increment, userStats.decrement, updateCountMutation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">인원 카운트</h3>
        {/* 현재 사용자의 순 기여도 표시 */}
        <div className="text-sm text-gray-500">
          순 기여도: <span className="font-bold text-blue-600">{userStats.netCount}</span>
        </div>
      </div>

      {/* In/Out 버튼 그리드 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CountButton
          type="in"
          onClick={handleInClick}
          isLoading={isLoading && lastAction === 'in'}
          disabled={isLoading}
        >
          <div className="text-xl font-bold">IN</div>
          <div className="text-sm mt-1">입장</div>
        </CountButton>

        <CountButton
          type="out"
          onClick={handleOutClick}
          isLoading={isLoading && lastAction === 'out'}
          disabled={isLoading}
        >
          <div className="text-xl font-bold">OUT</div>
          <div className="text-sm mt-1">퇴장</div>
        </CountButton>
      </div>

      {/* 사용자 카운트 요약 */}
      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-green-600 font-bold text-lg">{userStats.increment}</div>
            <div className="text-gray-500">내가 센 입장</div>
          </div>
          <div>
            <div className="text-red-600 font-bold text-lg">{userStats.decrement}</div>
            <div className="text-gray-500">내가 센 퇴장</div>
          </div>
          <div>
            <div className="text-blue-600 font-bold text-lg">{userStats.netCount}</div>
            <div className="text-gray-500">순 기여</div>
          </div>
        </div>
      </div>

      {/* 도움말 텍스트 */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        💡 각 버튼을 누르면 실시간으로 카운트가 업데이트됩니다
      </div>
    </div>
  );
}
