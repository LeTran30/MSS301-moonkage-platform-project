import { describe, expect, it } from 'vitest';
import { formatCountdown, formatDateTime, secondsUntil } from './format';

describe('format', () => {
  it('shows date and time in UTC+7 as HH:mm DD/MM/YYYY', () => {
    expect(formatDateTime('2026-10-19T10:10:13Z')).toBe('17:10 19/10/2026');
    // crosses midnight in Vietnam
    expect(formatDateTime('2026-12-31T18:30:00Z')).toBe('01:30 01/01/2027');
  });

  it('shows a countdown as m:ss and never below zero', () => {
    expect(formatCountdown(300)).toBe('5:00');
    expect(formatCountdown(61)).toBe('1:01');
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('rounds the seconds left up so 0 only shows once expired', () => {
    const now = Date.parse('2026-10-19T10:00:00Z');
    expect(secondsUntil('2026-10-19T10:00:00.400Z', now)).toBe(1);
    expect(secondsUntil('2026-10-19T09:59:59Z', now)).toBe(0);
  });
});
