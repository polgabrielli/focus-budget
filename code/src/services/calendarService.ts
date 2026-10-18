import { type Reminder } from '../types';

/**
 * Generates a Google Calendar Universal Link with pre-filled title, details, and reminder date.
 * When tapped on iPhone 11 or PC, it opens Google Calendar directly.
 */
export function generateGoogleCalendarUrl(reminder: Reminder): string {
  // Format date YYYYMMDD for all-day event
  const cleanDate = reminder.dueDate.replace(/-/g, '');
  
  // End date is next day for all-day event
  const d = new Date(`${reminder.dueDate}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const endYear = d.getFullYear();
  const endMonth = String(d.getMonth() + 1).padStart(2, '0');
  const endDay = String(d.getDate()).padStart(2, '0');
  const cleanEndDate = `${endYear}${endMonth}${endDay}`;

  const title = encodeURIComponent(`💳 Vencimiento: ${reminder.title}`);
  const details = encodeURIComponent(
    `Recordatorio de pago Focus Budget.\nMonto: ${reminder.currency === 'ARS' ? '$' : 'US$'} ${reminder.amount.toLocaleString('es-AR')}\nRegistrado en la app Focus Budget.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${cleanDate}/${cleanEndDate}`;
}

/**
 * Sanitizes text fields embedded into RFC 5545 .ics files to prevent CRLF / property injection.
 */
export function sanitizeIcsText(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

/**
 * Generates an RFC 5545 standard .ics file content with staggered alarms
 * (7 days before, 3 days before, 1 day before, and day of due date).
 * Compatible with Apple Calendar and Google Calendar.
 */
export function generateIcsContent(reminder: Reminder): string {
  const cleanDate = reminder.dueDate.replace(/[^0-9]/g, '').slice(0, 8);
  const safeId = reminder.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeTitle = sanitizeIcsText(reminder.title);
  const currencySymbol = reminder.currency === 'ARS' ? '$' : 'US$';
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Focus Budget//Vencimientos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:focusbudget-reminder-${safeId}@focusbudget.app`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `SUMMARY:💳 Vencimiento: ${safeTitle} (${currencySymbol} ${reminder.amount})`,
    `DESCRIPTION:Recordatorio de vencimiento Focus Budget\\nMonto: ${currencySymbol} ${reminder.amount.toLocaleString('es-AR')}`,
    'STATUS:CONFIRMED',
    // Alarma 1: 7 días antes a las 9:00 AM (-P7D)
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Recordatorio: ${safeTitle} vence en 7 días`,
    'END:VALARM',
    // Alarma 2: 3 días antes (-P3D)
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Atención: ${safeTitle} vence en 3 días`,
    'END:VALARM',
    // Alarma 3: 1 día antes (-P1D)
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Urgente: ${safeTitle} vence mañana`,
    'END:VALARM',
    // Alarma 4: Mismo día (-PT0M)
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:HOY vence ${safeTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download of the .ics file.
 */
export function downloadIcsFile(reminder: Reminder): void {
  const icsText = generateIcsContent(reminder);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeSlug = reminder.title.toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'recordatorio';
  link.setAttribute('download', `vencimiento_${safeSlug}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculates days remaining until dueDate and returns urgency level + human-readable label.
 * Semáforo:
 * - 'expired': < 0 days (Vencido)
 * - 'today': 0 days (Hoy) - Red
 * - 'tomorrow': 1 day (Mañana) - Orange
 * - 'soon': 2 to 4 days (En X días) - Yellow
 * - 'normal': 5 to 7 days (En X días) - Green
 * - 'distant': > 7 days
 */
export function calculateDueUrgency(dueDate: string): {
  daysDiff: number;
  urgency: 'expired' | 'today' | 'tomorrow' | 'soon' | 'normal' | 'distant';
  label: string;
  badgeClass: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dueDate}T00:00:00`);
  const diffTime = target.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return {
      daysDiff,
      urgency: 'expired',
      label: `Venció hace ${Math.abs(daysDiff)}d`,
      badgeClass: 'bg-rose-600/20 text-rose-300 border-rose-500/40',
    };
  }

  if (daysDiff === 0) {
    return {
      daysDiff,
      urgency: 'today',
      label: 'Vence Hoy',
      badgeClass: 'bg-rose-500 text-white font-bold animate-pulse',
    };
  }

  if (daysDiff === 1) {
    return {
      daysDiff,
      urgency: 'tomorrow',
      label: 'Mañana',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-semibold',
    };
  }

  if (daysDiff <= 4) {
    return {
      daysDiff,
      urgency: 'soon',
      label: `En ${daysDiff} días`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium',
    };
  }

  if (daysDiff <= 7) {
    return {
      daysDiff,
      urgency: 'normal',
      label: `En ${daysDiff} días`,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium',
    };
  }

  return {
    daysDiff,
    urgency: 'distant',
    label: `En ${daysDiff} días`,
    badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
  };
}
