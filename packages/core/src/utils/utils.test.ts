import { formatDate, formatDuration, isInRange } from './index';

describe('Core Utilities', () => {
  describe('formatDate', () => {
    it('should format a date correctly', () => {
      const date = new Date('2025-04-15T12:00:00Z');
      expect(formatDate(date)).toMatch(/Apr 15, 2025/);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('45 sec');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2 min 5 sec');
    });
  });

  describe('isInRange', () => {
    it('should return true for values in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
    });

    it('should return false for values outside range', () => {
      expect(isInRange(15, 1, 10)).toBe(false);
    });

    it('should return true for values at the range boundaries', () => {
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });
  });
});
