'use client';

import type { MinuteStats } from '@kamf/interface';
import { useMemo, useState, useEffect } from 'react';
import {
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HourlyChartProps {
  minuteStats: MinuteStats[];
  isLoading?: boolean;
}

interface ChartDataPoint {
  time: string;
  fullTime: string; // 툴팁용 전체 시간
  currentInside: number;
  incrementDelta: number;
  decrementDelta: number;
}

/**
 * 누적 데이터를 분당 증감량으로 변환
 */
function processChartData(minuteStats: MinuteStats[]): ChartDataPoint[] {
  if (!minuteStats || minuteStats.length === 0) return [];

  return minuteStats.map((current, index) => {
    const previous = index > 0 ? minuteStats[index - 1] : null;

    // 시간 포맷팅
    const date = new Date(current.minute);
    const time = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const fullTime = date.toLocaleString('ko-KR');

    return {
      time,
      fullTime,
      currentInside: current.currentInside,
      incrementDelta: previous
        ? Math.max(0, current.increment - previous.increment)
        : current.increment,
      decrementDelta: previous
        ? Math.max(0, current.decrement - previous.decrement)
        : current.decrement,
    };
  });
}

/**
 * 커스텀 툴팁 컴포넌트
 */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold text-gray-700 mb-2">{data.fullTime}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">현재 인원</span>
            </div>
            <span className="font-semibold text-blue-600">{data.currentInside}명</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">분당 입장</span>
            </div>
            <span className="font-semibold text-green-600">+{data.incrementDelta}명</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm">분당 퇴장</span>
            </div>
            <span className="font-semibold text-red-600">-{data.decrementDelta}명</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * 시간대별 통계 차트 컴포넌트
 */
export default function HourlyChart({ minuteStats, isLoading }: HourlyChartProps) {
  // 화면 너비 상태 관리
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // 화면 크기 감지
  useEffect(() => {
    const updateWidth = () => {
      // 차트 컨테이너의 실제 너비를 추정 (패딩, 마진 제외)
      const screenWidth = window.innerWidth;
      const estimatedWidth =
        screenWidth > 1024
          ? Math.min(screenWidth * 0.6, 800) // 데스크탑: 화면의 60% 또는 최대 800px
          : screenWidth - 64; // 모바일: 좌우 패딩 32px씩 제외

      setContainerWidth(estimatedWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 차트 데이터 가공 (메모화)
  const chartData = useMemo(() => {
    return processChartData(minuteStats);
  }, [minuteStats]);

  // 반응형 X축 라벨 간격 계산
  const xAxisInterval = useMemo(() => {
    if (!chartData.length || !containerWidth) return 0;

    const MIN_LABEL_SPACING = 60; // 최소 라벨 간격 (픽셀)

    // 화면 너비 기반 최적 라벨 개수 계산 (간격만 보장)
    const optimalLabelCount = Math.floor(containerWidth / MIN_LABEL_SPACING);

    // interval 계산 (0이면 모든 라벨 표시, 숫자가 클수록 라벨 간격이 넓어짐)
    const interval = Math.max(0, Math.floor(chartData.length / optimalLabelCount));

    return interval;
  }, [chartData.length, containerWidth]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">차트 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
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
          <p className="text-gray-500 text-lg mb-2">차트 데이터가 없습니다</p>
          <p className="text-gray-400 text-sm">통계 데이터가 수집되면 차트가 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-1 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-700">현재 인원</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-700">분당 입장</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-700">분당 퇴장</span>
        </div>
      </div>

      {/* 차트 */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              interval={xAxisInterval} // 화면 크기에 따른 동적 라벨 간격
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              label={{
                value: '인원 수',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 분당 입장 라인 차트 */}
            <Line
              type="monotone"
              dataKey="incrementDelta"
              stroke="#10b981"
              strokeWidth={2}
              name="분당 입장"
              dot={false} // 점 숨김 - 360개 점이 모바일에서 너무 조밀함
              activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
            />

            {/* 분당 퇴장 라인 차트 */}
            <Line
              type="monotone"
              dataKey="decrementDelta"
              stroke="#ef4444"
              strokeWidth={2}
              name="분당 퇴장"
              dot={false} // 점 숨김 - 360개 점이 모바일에서 너무 조밀함
              activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2 }}
            />

            {/* 현재 인원 라인 차트 */}
            <Line
              type="monotone"
              dataKey="currentInside"
              stroke="#3b82f6"
              strokeWidth={3}
              name="현재 인원"
              dot={false} // 점 숨김 - 360개 점이 모바일에서 너무 조밀함
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 정보 */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          최근 6시간 분단위 통계 • 화면 크기에 따라 시간 라벨 조정
        </p>
      </div>
    </div>
  );
}
