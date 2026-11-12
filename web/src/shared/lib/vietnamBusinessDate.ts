const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Current Vietnam calendar date as the `yyyy-MM-dd` value used by HTML date inputs and backend LocalDate fields. */
export function vietnamBusinessDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = new Map(parts.map((part) => [part.type, part.value]));
  return `${value.get('year')}-${value.get('month')}-${value.get('day')}`;
}
