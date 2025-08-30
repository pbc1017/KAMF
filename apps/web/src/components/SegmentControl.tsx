'use client';

import { FestivalDay } from '@kamf/interface/types/festival.js';

interface SegmentControlProps {
  selectedDay: FestivalDay;
  onDayChange: (day: FestivalDay) => void;
}

export function SegmentControl({ selectedDay, onDayChange }: SegmentControlProps) {
  const days = [
    { value: FestivalDay.SATURDAY, label: 'SAT' },
    { value: FestivalDay.SUNDAY, label: 'SUN' },
  ];

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 w-fit mx-auto">
      {days.map(day => (
        <button
          key={day.value}
          onClick={() => onDayChange(day.value)}
          className={`px-8 py-3 rounded-md font-semibold text-sm transition-all duration-200 ${
            selectedDay === day.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
}
