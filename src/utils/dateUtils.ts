// Date and time utilities
import moment from 'moment';

// Configure moment for Vietnamese locale
moment.locale('vi');

/**
 * Format date to Vietnamese format
 */
export const formatDate = (date: Date | string | number, format?: string): string => {
  const m = moment(date);
  
  if (!m.isValid()) {
    return '';
  }
  
  return m.format(format || 'DD/MM/YYYY');
};

/**
 * Format time
 */
export const formatTime = (date: Date | string | number): string => {
  return moment(date).format('HH:mm');
};

/**
 * Format datetime
 */
export const formatDateTime = (date: Date | string | number): string => {
  return moment(date).format('DD/MM/YYYY HH:mm');
};

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  return moment(date).fromNow();
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string | number): boolean => {
  return moment(date).isSame(moment(), 'day');
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: Date | string | number): boolean => {
  return moment(date).isSame(moment().subtract(1, 'day'), 'day');
};

/**
 * Check if date is this week
 */
export const isThisWeek = (date: Date | string | number): boolean => {
  return moment(date).isSame(moment(), 'week');
};

/**
 * Check if date is this month
 */
export const isThisMonth = (date: Date | string | number): boolean => {
  return moment(date).isSame(moment(), 'month');
};

/**
 * Get smart date label
 */
export const getSmartDateLabel = (date: Date | string | number): string => {
  if (isToday(date)) {
    return 'Hôm nay';
  }
  if (isYesterday(date)) {
    return 'Hôm qua';
  }
  if (isThisWeek(date)) {
    return moment(date).format('dddd'); // Day name
  }
  return formatDate(date);
};

/**
 * Get start of day
 */
export const startOfDay = (date?: Date): Date => {
  return moment(date).startOf('day').toDate();
};

/**
 * Get end of day
 */
export const endOfDay = (date?: Date): Date => {
  return moment(date).endOf('day').toDate();
};

/**
 * Get start of week
 */
export const startOfWeek = (date?: Date): Date => {
  return moment(date).startOf('week').toDate();
};

/**
 * Get end of week
 */
export const endOfWeek = (date?: Date): Date => {
  return moment(date).endOf('week').toDate();
};

/**
 * Get start of month
 */
export const startOfMonth = (date?: Date): Date => {
  return moment(date).startOf('month').toDate();
};

/**
 * Get end of month
 */
export const endOfMonth = (date?: Date): Date => {
  return moment(date).endOf('month').toDate();
};

/**
 * Get array of days in a range
 */
export const getDaysInRange = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const current = moment(start);
  const endMoment = moment(end);
  
  while (current.isSameOrBefore(endMoment, 'day')) {
    days.push(current.toDate());
    current.add(1, 'day');
  }
  
  return days;
};

/**
 * Get month name in Vietnamese
 */
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  return months[monthIndex] || '';
};

/**
 * Get day name in Vietnamese
 */
export const getDayName = (dayIndex: number): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[dayIndex] || '';
};
