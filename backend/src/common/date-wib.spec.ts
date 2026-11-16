import { isBeforeTodayWib, todayWib } from './date-wib';

describe('date-wib', () => {
  it('UTC 18:30 sudah hari berikutnya di WIB', () => {
    expect(todayWib(new Date('2026-11-15T18:30:00Z'))).toBe('2026-11-16');
  });

  it('UTC 16:59 masih hari yang sama di WIB', () => {
    expect(todayWib(new Date('2026-11-15T16:59:00Z'))).toBe('2026-11-15');
  });

  it('isBeforeTodayWib: kemarin true, hari ini & besok false', () => {
    const now = new Date('2026-11-15T18:30:00Z'); // 16 Nov WIB
    expect(isBeforeTodayWib('2026-11-15', now)).toBe(true);
    expect(isBeforeTodayWib('2026-11-16', now)).toBe(false);
    expect(isBeforeTodayWib('2026-11-17T00:00:00.000Z', now)).toBe(false);
  });
});
