import { describe, it, expect } from 'vitest';
import { 
  calculateDueUrgency, 
  generateGoogleCalendarUrl, 
  generateIcsContent 
} from '../calendarService';
import { type Reminder } from '../../types';

describe('calendarService', () => {
  describe('calculateDueUrgency', () => {
    it('returns "today" for today\'s date', () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;

      const res = calculateDueUrgency(todayStr);
      expect(res.urgency).toBe('today');
      expect(res.label).toBe('Vence Hoy');
      expect(res.badgeClass).toContain('bg-rose-500');
    });

    it('returns "tomorrow" for 1 day ahead', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
        tomorrow.getDate()
      ).padStart(2, '0')}`;

      const res = calculateDueUrgency(tomorrowStr);
      expect(res.urgency).toBe('tomorrow');
      expect(res.label).toBe('Mañana');
      expect(res.badgeClass).toContain('text-orange-300');
    });

    it('returns "soon" for 3 days ahead', () => {
      const future = new Date();
      future.setDate(future.getDate() + 3);
      const str = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(
        future.getDate()
      ).padStart(2, '0')}`;

      const res = calculateDueUrgency(str);
      expect(res.urgency).toBe('soon');
      expect(res.label).toBe('En 3 días');
      expect(res.badgeClass).toContain('text-amber-300');
    });

    it('returns "expired" for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 2);
      const str = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(
        past.getDate()
      ).padStart(2, '0')}`;

      const res = calculateDueUrgency(str);
      expect(res.urgency).toBe('expired');
      expect(res.label).toContain('Venció hace 2d');
    });
  });

  describe('generateGoogleCalendarUrl', () => {
    it('creates valid Google Calendar deep-link with encoded parameters', () => {
      const mockReminder: Reminder = {
        id: 'test-123',
        title: 'Internet Fibertel',
        amount: 18500,
        currency: 'ARS',
        dueDate: '2026-10-25',
        categoryId: 'cat-hogar',
        isRecurring: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const url = generateGoogleCalendarUrl(mockReminder);

      expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
      expect(url).toContain('text=%F0%9F%92%B3%20Vencimiento%3A%20Internet%20Fibertel');
      expect(url).toContain('dates=20261025/20261026');
      expect(url).toContain('18.500');
    });
  });

  describe('generateIcsContent', () => {
    it('generates standard RFC 5545 iCalendar with 4 staggered alarm triggers (-P7D, -P3D, -P1D, -PT0M)', () => {
      const mockReminder: Reminder = {
        id: 'test-456',
        title: 'Edenor Luz',
        amount: 25000,
        currency: 'ARS',
        dueDate: '2026-11-10',
        categoryId: 'cat-hogar',
        isRecurring: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ics = generateIcsContent(mockReminder);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:💳 Vencimiento: Edenor Luz ($ 25000)');
      expect(ics).toContain('DTSTART;VALUE=DATE:20261110');

      // Check all 4 staggered alarms
      expect(ics).toContain('TRIGGER:-P7D'); // 7 days before
      expect(ics).toContain('TRIGGER:-P3D'); // 3 days before
      expect(ics).toContain('TRIGGER:-P1D'); // 1 day before
      expect(ics).toContain('TRIGGER:-PT0M'); // Day of due date
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
