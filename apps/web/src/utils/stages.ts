/**
 * 오늘 날짜(한국시간 기준)에 따라 적절한 stages URL을 반환
 * 2025년 9월 6일 이전: /stages?day=FRI
 * 2025년 9월 6일 이후: /stages?day=SAT
 */
export function getTodayStagesUrl(): string {
  const today = new Date();
  const koreaToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const targetDate = new Date(2025, 8, 6); // 2025년 9월 6일 (month는 0부터 시작)

  const dayParam = koreaToday < targetDate ? 'FRI' : 'SAT';
  return `/stages?day=${dayParam}`;
}
