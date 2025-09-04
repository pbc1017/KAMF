'use client';

import { FestivalDay } from '@kamf/interface/types/festival.type.js';
import { useLocale, useTranslations } from 'next-intl';

interface SegmentControlProps {
  selectedDay: FestivalDay;
  onDayChange: (day: FestivalDay) => void;
}

export function SegmentControl({ selectedDay, onDayChange }: SegmentControlProps) {
  const locale = useLocale();
  const t = useTranslations('days');
  const isEnglish = locale === 'en';

  const days = [
    {
      value: FestivalDay.FRIDAY,
      label: isEnglish ? t('fri') : t('friday'),
      shortLabel: t('fri'),
    },
    {
      value: FestivalDay.SATURDAY,
      label: isEnglish ? t('sat') : t('saturday'),
      shortLabel: t('sat'),
    },
  ];

  return (
    <div className="flex card-purple p-2 rounded-2xl w-fit mx-auto shadow-xl">
      {days.map(day => (
        <button
          key={day.value}
          onClick={() => onDayChange(day.value)}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
            selectedDay === day.value
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
              : 'text-purple-200 hover:text-white hover:bg-purple-500/20'
          }`}
        >
          <span className="hidden md:inline">{day.label}</span>
          <span className="md:hidden">{day.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
