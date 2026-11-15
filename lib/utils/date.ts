import type { AppLanguage } from '@/types/mensa';

export const SHORT_WEEKDAYS_BY_LANG: Record<AppLanguage, readonly string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
};

const FORMATTERS: Record<
  AppLanguage,
  {
    monthYear: Intl.DateTimeFormat;
    shortMonth: Intl.DateTimeFormat;
    shortWeekday: Intl.DateTimeFormat;
  }
> = {
  en: {
    monthYear: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }),
    shortMonth: new Intl.DateTimeFormat('en-GB', { month: 'short' }),
    shortWeekday: new Intl.DateTimeFormat('en-GB', { weekday: 'short' }),
  },
  de: {
    monthYear: new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }),
    shortMonth: new Intl.DateTimeFormat('de-DE', { month: 'short' }),
    shortWeekday: new Intl.DateTimeFormat('de-DE', { weekday: 'short' }),
  },
};

const GERMAN_DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export interface WeekdayItem {
  dateStr: string;
  dayShort: string;
  dayNum: number;
  monthShort: string;
  isToday: boolean;
}

export interface CalendarGridCell {
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string): Date {
  const parts = String(value).split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day);
}

export function isWeekend(date: Date): boolean {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

export function getInitialWeekdayString(skipWeekends = true, now = new Date()): string {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (skipWeekends) {
    while (isWeekend(target)) {
      target.setDate(target.getDate() + 1);
    }
  }
  return toDateString(target);
}

export function getMondayOfDate(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function getWeekdaysForDate(
  dateStr: string,
  language: AppLanguage = 'en',
): WeekdayItem[] {
  const current = parseDateInput(dateStr);
  const monday = getMondayOfDate(current);
  const todayStr = toDateString(new Date());
  const weekdays = SHORT_WEEKDAYS_BY_LANG[language];
  const { shortMonth } = FORMATTERS[language];

  const items: WeekdayItem[] = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const cellDateStr = toDateString(dayDate);
    items.push({
      dateStr: cellDateStr,
      dayShort: weekdays[i],
      dayNum: dayDate.getDate(),
      monthShort: shortMonth.format(dayDate),
      isToday: cellDateStr === todayStr,
    });
  }
  return items;
}

export function shiftWeekdayDate(
  dateStr: string,
  dayDelta: number,
  skipWeekends = true,
): string {
  if (!Number.isInteger(dayDelta) || dayDelta === 0) {
    return dateStr;
  }

  const direction = dayDelta > 0 ? 1 : -1;
  let remaining = Math.abs(dayDelta);
  const current = parseDateInput(dateStr);

  while (remaining > 0) {
    current.setDate(current.getDate() + direction);
    if (!skipWeekends || !isWeekend(current)) {
      remaining -= 1;
    }
  }

  return toDateString(current);
}

export function formatDateHeader(
  dateStr: string,
  language: AppLanguage = 'en',
): string {
  const date = parseDateInput(dateStr);
  const weekday = FORMATTERS[language].shortWeekday.format(date).replace(/\.$/, '');
  const formatted = GERMAN_DATE_FORMATTER.format(date);
  return `${weekday}, ${formatted}`;
}

export function formatMonthYearTitle(
  year: number,
  month: number,
  language: AppLanguage = 'en',
): string {
  return FORMATTERS[language].monthYear.format(new Date(year, month, 1));
}

export function buildMonthGrid(year: number, month: number): CalendarGridCell[] {
  const viewDate = new Date(year, month, 1);
  const firstDayOfWeek = (viewDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const todayStr = toDateString(new Date());

  const cells: CalendarGridCell[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    const cellStr = toDateString(prevDate);
    cells.push({
      dateStr: cellStr,
      day: prevDate.getDate(),
      isCurrentMonth: false,
      isWeekend: isWeekend(prevDate),
      isToday: cellStr === todayStr,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const cellStr = toDateString(curDate);
    cells.push({
      dateStr: cellStr,
      day,
      isCurrentMonth: true,
      isWeekend: isWeekend(curDate),
      isToday: cellStr === todayStr,
    });
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    const cellStr = toDateString(nextDate);
    cells.push({
      dateStr: cellStr,
      day,
      isCurrentMonth: false,
      isWeekend: isWeekend(nextDate),
      isToday: cellStr === todayStr,
    });
  }

  return cells;
}
