/** Display formats of the design system: DD/MM/YYYY, times in UTC+7. */

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VIETNAM_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** `2026-10-19T10:10:13Z` → `17:10 19/10/2026`. */
export function formatDateTime(iso: string): string {
  const parts = Object.fromEntries(dateTimeFormat.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.hour}:${parts.minute} ${parts.day}/${parts.month}/${parts.year}`;
}

/** Seconds → `m:ss`. */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function secondsUntil(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000));
}
