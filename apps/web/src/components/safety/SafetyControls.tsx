'use client';

import type { TodayStats, UserStats } from '@kamf/interface/dtos/safety.dto.js';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import CountButton from './CountButton';

import { useSafetyStats, useUpdateSafetyCount } from '@/hooks/useSafety';

/**
 * 현재 도메인에서 환경을 추출
 * dev.kamf.site -> 'dev'
 * kamf.site -> 'prod'
 * localhost -> 'dev'
 */
function getEnvironmentFromDomain(): 'dev' | 'prod' {
  if (typeof window === 'undefined') return 'dev'; // SSR 처리

  const hostname = window.location.hostname;

  // 프로덕션 도메인
  if (hostname === 'kamf.site') {
    return 'prod';
  }

  // 개발 도메인 또는 기타 (localhost 포함)
  return 'dev';
}

/**
 * 환경별 로컬스토리지 키 생성
 */
function getEnvironmentKey(baseKey: string): string {
  const env = getEnvironmentFromDomain();
  return `${baseKey}_${env}`;
}

/**
 * 주어진 날짜가 오늘보다 이전인지 확인
 */
function isBeforeToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  return compareDate < today;
}

const SAFETY_COUNT_KEY = getEnvironmentKey('kamf_safety_count');
const SAFETY_LAST_SYNC_KEY = getEnvironmentKey('kamf_safety_last_sync');

interface LocalSafetyCount {
  increment: number;
  decrement: number;
  lastUpdated: string;
}

interface SafetyControlsProps {
  onStatsUpdate?: (stats: {
    todayStats: TodayStats;
    userStats: UserStats;
    currentTotal: number;
  }) => void;
}

export default function SafetyControls({ onStatsUpdate }: SafetyControlsProps) {
  const locale = useLocale();
  const t = useTranslations('safety.controls');
  const toast_t = useTranslations('safety.toast');

  // 언어별 로케일 설정
  const timeLocale = locale === 'en' ? 'en-US' : 'ko-KR';
  // 로컬 상태 관리
  const [localCounts, setLocalCounts] = useState<LocalSafetyCount>({
    increment: 0,
    decrement: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: stats } = useSafetyStats();
  const updateCountMutation = useUpdateSafetyCount();
  const syncIntervalRef = useRef<number | null>(null);
  const localCountsRef = useRef<LocalSafetyCount>(localCounts);

  // localCountsRef를 항상 최신 상태로 유지
  useEffect(() => {
    localCountsRef.current = localCounts;
  }, [localCounts]);

  // 로컬스토리지에서 데이터 로드 (날짜 검증 포함)
  const loadFromLocalStorage = useCallback(() => {
    try {
      const currentEnv = getEnvironmentFromDomain();
      console.log(`🔍 Loading data from localStorage (${currentEnv} environment)`);

      const storedCounts = localStorage.getItem(SAFETY_COUNT_KEY);
      const storedLastSync = localStorage.getItem(SAFETY_LAST_SYNC_KEY);

      if (storedCounts) {
        const parsed: LocalSafetyCount = JSON.parse(storedCounts);
        const lastUpdatedDate = new Date(parsed.lastUpdated);

        // 날짜 검증: 어제 또는 그 이전 데이터라면 제거하고 불러오지 않음
        if (isBeforeToday(lastUpdatedDate)) {
          console.log('🗑️  Removing expired data from localStorage:', {
            lastUpdated: parsed.lastUpdated,
            data: parsed,
            environment: currentEnv,
          });

          // 만료된 데이터 제거
          localStorage.removeItem(SAFETY_COUNT_KEY);
          localStorage.removeItem(SAFETY_LAST_SYNC_KEY);

          // 초기값으로 설정
          const initialCounts: LocalSafetyCount = {
            increment: 0,
            decrement: 0,
            lastUpdated: new Date().toISOString(),
          };
          setLocalCounts(initialCounts);
          localCountsRef.current = initialCounts;
          setLastSyncTime(null);

          console.log('✨ Initialized with fresh data for today');
        } else {
          // 오늘 데이터라면 정상 로드
          setLocalCounts(parsed);
          localCountsRef.current = parsed;
          console.log(`✅ Loaded valid data from localStorage (${currentEnv}):`, parsed);

          if (storedLastSync) {
            setLastSyncTime(storedLastSync);
          }
        }
      } else {
        console.log(`💫 No existing data found in localStorage (${currentEnv} environment)`);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setIsInitialized(true);
    }
  }, []);

  // 로컬스토리지에 데이터 저장
  const saveToLocalStorage = useCallback((counts: LocalSafetyCount) => {
    try {
      const currentEnv = getEnvironmentFromDomain();
      localStorage.setItem(SAFETY_COUNT_KEY, JSON.stringify(counts));
      console.log(`💾 Saved to localStorage (${currentEnv}):`, counts);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // 서버와 동기화
  const syncWithServer = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);

    const currentCounts = localCountsRef.current;
    const currentEnv = getEnvironmentFromDomain();
    console.log(
      `📡 Starting sync with server at: ${new Date().toLocaleTimeString('ko-KR')} (${currentEnv} environment)`,
      'Counts:',
      currentCounts
    );

    try {
      // 로컬 데이터를 서버로 전송
      const response = await updateCountMutation.mutateAsync({
        increment: currentCounts.increment,
        decrement: currentCounts.decrement,
      });

      // 동기화 시간 업데이트
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);
      localStorage.setItem(SAFETY_LAST_SYNC_KEY, syncTime);

      console.log(
        `✅ Sync successful at: ${new Date().toLocaleTimeString('ko-KR')} (${currentEnv} environment)`,
        'Server response:',
        response
      );
      console.log('📊 Updated todayStats from count response:', response.todayStats);

      // 부모 컴포넌트에 최신 통계 데이터 전달
      if (onStatsUpdate) {
        onStatsUpdate({
          todayStats: response.todayStats,
          userStats: response.userStats,
          currentTotal: response.currentTotal,
        });
      }

      // 카운트 동기화 성공 토스트 (값이 0이 아닐 때만)
      if (currentCounts.increment > 0 || currentCounts.decrement > 0) {
        toast.success(toast_t('syncSuccess', { count: response.currentTotal }), {
          icon: '🔄',
          duration: 2500,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(toast_t('syncError'), {
        icon: '⚠️',
        duration: 3500,
        position: 'top-center',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateCountMutation]);

  // 컴포넌트 초기화
  useEffect(() => {
    // 로컬스토리지에서 데이터 로드
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // 초기화 완료 후 동기화 인터벌 설정 (안정적인 interval)
  useEffect(() => {
    if (!isInitialized) return;

    // 5초 간격 동기화 설정 - syncWithServer 의존성 제거
    const currentEnv = getEnvironmentFromDomain();
    console.log(`🔄 Setting up sync interval - every 5 seconds (${currentEnv} environment)`);
    syncIntervalRef.current = window.setInterval(() => {
      console.log(
        `⏰ Sync interval triggered at: ${new Date().toLocaleTimeString('ko-KR')} (${currentEnv})`
      );
      syncWithServer(); // 현재 시점의 최신 syncWithServer 함수 호출
    }, 5000);

    return () => {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current);
      }
    };
  }, [isInitialized]); // syncWithServer 의존성 제거로 안정적인 interval

  // 서버 데이터와 로컬 데이터 동기화 (초기 로딩 시에만)
  useEffect(() => {
    if (
      isInitialized &&
      stats?.userStats &&
      localCounts.increment === 0 &&
      localCounts.decrement === 0 &&
      (stats.userStats.increment > 0 || stats.userStats.decrement > 0)
    ) {
      // 로컬스토리지가 비어있고 서버에 데이터가 있는 경우에만 서버 데이터로 초기화
      const currentEnv = getEnvironmentFromDomain();
      console.log(`🔄 Initializing from server data (${currentEnv} environment):`, stats.userStats);
      const newCounts: LocalSafetyCount = {
        increment: stats.userStats.increment,
        decrement: stats.userStats.decrement,
        lastUpdated: new Date().toISOString(),
      };
      setLocalCounts(newCounts);
      localCountsRef.current = newCounts;
      saveToLocalStorage(newCounts);
    }
  }, [
    isInitialized,
    stats?.userStats,
    localCounts.increment,
    localCounts.decrement,
    saveToLocalStorage,
  ]);

  // In 버튼 클릭 핸들러 (로컬 업데이트만)
  const handleInClick = useCallback(() => {
    const newCounts: LocalSafetyCount = {
      increment: localCounts.increment + 1,
      decrement: localCounts.decrement,
      lastUpdated: new Date().toISOString(),
    };

    const currentEnv = getEnvironmentFromDomain();
    console.log(
      `🔴 IN button clicked at: ${new Date().toLocaleTimeString('ko-KR')} (${currentEnv} environment)`,
      'New counts:',
      newCounts
    );
    setLocalCounts(newCounts);
    localCountsRef.current = newCounts;
    saveToLocalStorage(newCounts);

    // 즉시 UI 피드백 - 동기화 완료 시 토스트로 알림
  }, [localCounts, saveToLocalStorage]);

  // Out 버튼 클릭 핸들러 (로컬 업데이트만)
  const handleOutClick = useCallback(() => {
    const newCounts: LocalSafetyCount = {
      increment: localCounts.increment,
      decrement: localCounts.decrement + 1,
      lastUpdated: new Date().toISOString(),
    };

    const currentEnv = getEnvironmentFromDomain();
    console.log(
      `🟢 OUT button clicked at: ${new Date().toLocaleTimeString('ko-KR')} (${currentEnv} environment)`,
      'New counts:',
      newCounts
    );
    setLocalCounts(newCounts);
    localCountsRef.current = newCounts;
    saveToLocalStorage(newCounts);

    // 즉시 UI 피드백 - 동기화 완료 시 토스트로 알림
  }, [localCounts, saveToLocalStorage]);

  // 현재 표시할 통계 계산 (로컬 + 서버 혼합)
  const displayStats = {
    increment: localCounts.increment,
    decrement: localCounts.decrement,
    netCount: localCounts.increment - localCounts.decrement,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{t('title')}</h3>
        {/* 동기화 상태 및 순 기여도 표시 */}
        <div className="text-right text-sm">
          <div className="text-gray-500 mb-1">
            {t('netCount')}:{' '}
            <span className="font-bold text-blue-600">{displayStats.netCount}</span>
          </div>
          {isSyncing && (
            <div className="text-orange-600 text-xs flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-600 mr-1"></div>
              {t('syncing')}
            </div>
          )}
        </div>
      </div>

      {/* In/Out 버튼 그리드 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CountButton
          type="in"
          onClick={handleInClick}
          isLoading={false} // 로컬 업데이트는 즉시 처리
          disabled={false}
        >
          <div className="text-xl font-bold">{t('in')}</div>
          <div className="text-sm mt-1">{t('enter')}</div>
        </CountButton>

        <CountButton
          type="out"
          onClick={handleOutClick}
          isLoading={false} // 로컬 업데이트는 즉시 처리
          disabled={false}
        >
          <div className="text-xl font-bold">{t('out')}</div>
          <div className="text-sm mt-1">{t('exit')}</div>
        </CountButton>
      </div>

      {/* 사용자 카운트 요약 */}
      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-green-600 font-bold text-lg">{displayStats.increment}</div>
            <div className="text-gray-500">{t('enter')}</div>
          </div>
          <div>
            <div className="text-red-600 font-bold text-lg">{displayStats.decrement}</div>
            <div className="text-gray-500">{t('exit')}</div>
          </div>
          <div>
            <div className="text-blue-600 font-bold text-lg">{displayStats.netCount}</div>
            <div className="text-gray-500">{t('netCount')}</div>
          </div>
        </div>
      </div>

      {/* 마지막 동기화 시간 및 상태 */}
      <div className="mt-4 border-t pt-3">
        <div className="text-xs text-gray-400 text-center">💡 {t('syncInfo')}</div>
        {lastSyncTime && (
          <div className="text-xs text-gray-500 text-center mt-2">
            {t('lastSync')}: {new Date(lastSyncTime).toLocaleTimeString(timeLocale)}
          </div>
        )}
        {localCounts.lastUpdated && (
          <div className="text-xs text-gray-400 text-center">
            {t('lastUpdate')}: {new Date(localCounts.lastUpdated).toLocaleTimeString(timeLocale)}
          </div>
        )}
      </div>
    </div>
  );
}
