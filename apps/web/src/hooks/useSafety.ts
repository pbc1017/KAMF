'use client';

import type {
  CountRequestDto,
  CountResponseDto,
  StatsResponseDto,
  HistoryQueryDto,
  HistoryResponseDto,
} from '@kamf/interface/dtos/safety.dto.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { apiClient } from '@/lib/api';

// ================================
// Safety API Functions (Internal)
// ================================

/**
 * 안전 카운트 업데이트
 * POST /safety/count
 */
async function updateSafetyCount(request: CountRequestDto): Promise<CountResponseDto> {
  return apiClient<CountResponseDto>('safety/count', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 안전 통계 조회
 * GET /safety/stats
 */
async function getSafetyStats(date?: string): Promise<StatsResponseDto> {
  const queryParams = date ? `?date=${date}` : '';
  return apiClient<StatsResponseDto>(`safety/stats${queryParams}`);
}

/**
 * 안전 히스토리 조회
 * GET /safety/history
 */
async function getSafetyHistory(query: HistoryQueryDto): Promise<HistoryResponseDto> {
  const params = new URLSearchParams();
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  return apiClient<HistoryResponseDto>(`safety/history?${params.toString()}`);
}

// ================================
// React Query Hooks
// ================================

// Query Keys
const SAFETY_QUERY_KEYS = {
  stats: ['safety', 'stats'] as const,
  history: ['safety', 'history'] as const,
} as const;

/**
 * 안전 카운트 업데이트 훅
 */
export function useUpdateSafetyCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSafetyCount,
    onMutate: async (variables: CountRequestDto) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: SAFETY_QUERY_KEYS.stats });

      // 이전 데이터 백업
      const previousStats = queryClient.getQueryData<StatsResponseDto>(SAFETY_QUERY_KEYS.stats);

      // 낙관적 업데이트
      if (previousStats) {
        const incrementDelta = (variables.increment || 0) - previousStats.userStats.increment;
        const decrementDelta = (variables.decrement || 0) - previousStats.userStats.decrement;

        queryClient.setQueryData<StatsResponseDto>(SAFETY_QUERY_KEYS.stats, {
          ...previousStats,
          userStats: {
            increment: variables.increment || 0,
            decrement: variables.decrement || 0,
            netCount: (variables.increment || 0) - (variables.decrement || 0),
          },
          todayStats: {
            ...previousStats.todayStats,
            totalIncrement: Math.max(0, previousStats.todayStats.totalIncrement + incrementDelta),
            totalDecrement: Math.max(0, previousStats.todayStats.totalDecrement + decrementDelta),
            currentInside: Math.max(
              0,
              previousStats.todayStats.currentInside + incrementDelta - decrementDelta
            ),
          },
          currentTotal: Math.max(0, previousStats.currentTotal + incrementDelta - decrementDelta),
        });
      }

      return { previousStats };
    },
    onError: (error, variables, context) => {
      // 오류 시 이전 상태로 롤백
      if (context?.previousStats) {
        queryClient.setQueryData(SAFETY_QUERY_KEYS.stats, context.previousStats);
      }

      console.error('Safety count update failed:', error);
      toast.error('카운트 업데이트에 실패했습니다. 다시 시도해주세요.');
    },
    onSuccess: (data: CountResponseDto) => {
      // count 응답으로 받은 데이터로 stats 캐시 직접 업데이트 (invalidate 대신)
      const currentStatsData = queryClient.getQueryData<StatsResponseDto>(SAFETY_QUERY_KEYS.stats);

      if (currentStatsData) {
        const updatedStatsData: StatsResponseDto = {
          ...currentStatsData,
          todayStats: data.todayStats,
          userStats: data.userStats,
          currentTotal: data.currentTotal,
        };

        queryClient.setQueryData(SAFETY_QUERY_KEYS.stats, updatedStatsData);
      }

      // history는 필요시에만 무효화 (카운트 변경 시 히스토리도 업데이트되므로)
      queryClient.invalidateQueries({ queryKey: SAFETY_QUERY_KEYS.history });

      // 토스트는 SafetyControls에서 동기화 시에만 표시
    },
  });
}

/**
 * 안전 통계 조회 훅 (1분 간격 업데이트)
 */
export function useSafetyStats(date?: string) {
  return useQuery({
    queryKey: [...SAFETY_QUERY_KEYS.stats, date],
    queryFn: () => getSafetyStats(date),
    refetchInterval: 60000, // 1분마다 자동 새로고침 (카운트 동기화는 5초마다)
    refetchIntervalInBackground: true, // 백그라운드에서도 새로고침
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
    staleTime: 30000, // 30초간은 신선한 데이터로 간주
    retry: 3, // 실패 시 3번까지 재시도
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
}

/**
 * 안전 히스토리 조회 훅
 */
export function useSafetyHistory(query: HistoryQueryDto) {
  return useQuery({
    queryKey: [...SAFETY_QUERY_KEYS.history, query],
    queryFn: () => getSafetyHistory(query),
    enabled: !!(query.startDate && query.endDate), // 날짜가 있을 때만 활성화
    staleTime: 60000, // 1분간은 신선한 데이터로 간주 (히스토리는 덜 자주 변경됨)
    retry: 2, // 실패 시 2번까지 재시도
  });
}

/**
 * 안전 데이터 프리페칭 훅 (성능 최적화용)
 */
export function usePrefetchSafetyData() {
  const queryClient = useQueryClient();

  const prefetchStats = (date?: string) => {
    queryClient.prefetchQuery({
      queryKey: [...SAFETY_QUERY_KEYS.stats, date],
      queryFn: () => getSafetyStats(date),
      staleTime: 2000,
    });
  };

  const prefetchHistory = (query: HistoryQueryDto) => {
    queryClient.prefetchQuery({
      queryKey: [...SAFETY_QUERY_KEYS.history, query],
      queryFn: () => getSafetyHistory(query),
      staleTime: 60000,
    });
  };

  return { prefetchStats, prefetchHistory };
}

/**
 * 안전 카운트 빠른 업데이트 헬퍼
 */
export function useSafetyCountHelpers() {
  const updateCountMutation = useUpdateSafetyCount();

  const incrementCount = (currentIncrement: number = 0, currentDecrement: number = 0) => {
    updateCountMutation.mutate({
      increment: currentIncrement + 1,
      decrement: currentDecrement,
    });
  };

  const decrementCount = (currentIncrement: number = 0, currentDecrement: number = 0) => {
    updateCountMutation.mutate({
      increment: currentIncrement,
      decrement: currentDecrement + 1,
    });
  };

  return {
    incrementCount,
    decrementCount,
    isLoading: updateCountMutation.isPending,
    error: updateCountMutation.error,
  };
}
