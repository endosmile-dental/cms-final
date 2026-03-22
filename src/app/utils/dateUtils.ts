/**
 * Date utility functions for consistent timezone handling across client and server
 */

import { format } from "date-fns";

/**
 * Format a Date object to yyyy-MM-dd string format (IST timezone)
 * This ensures consistent date formatting across client and server,
 * especially when dealing with MongoDB dates stored in UTC.
 * Converts UTC dates to IST (UTC+5:30) before formatting.
 */
export const formatDateForServer = (date: Date): string => {
  // Convert UTC date to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  
  // Extract date components in IST
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a date string from server to Date object
 * Handles both ISO strings and yyyy-MM-dd format strings
 */
export const parseDateFromServer = (dateString: string): Date => {
  // If it's already in yyyy-MM-dd format, parse it directly
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString);
  }
  
  // If it's an ISO string, parse it
  return new Date(dateString);
};

/**
 * Get current date with time cleared (00:00:00) in local timezone
 * Useful for date comparisons without time components
 */
export const getLocalDate = (): Date => {
  const now = new Date();
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return localDate;
};

/**
 * Get current date and time in local timezone
 * Use this for timestamps that need to be in local timezone
 */
export const getLocalDateTime = (): Date => {
  return new Date();
};

/**
 * Format date for display purposes (human readable)
 */
export const formatForDisplay = (date: Date): string => {
  return format(date, "PPP"); // e.g., "Mar 23, 2026"
};

/**
 * Format date for input fields (yyyy-MM-dd)
 */
export const formatForInput = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

/**
 * Compare two dates ignoring time components
 * Returns true if both dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if a date is today (in local timezone)
 */
export const isToday = (date: Date): boolean => {
  const today = getLocalDate();
  const dateToCheck = getLocalDate();
  dateToCheck.setTime(date.getTime());
  return isSameDay(today, dateToCheck);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get start of day (00:00:00) for a given date
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day (23:59:59) for a given date
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};