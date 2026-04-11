/**
 * Production-safe Date utilities for IST (Asia/Kolkata)
 *
 * RULES:
 * - DB always stores UTC
 * - UI always uses IST
 * - Never trust JS Date timezone implicitly
 */

import { format, startOfDay, endOfDay, addDays, isSameDay } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Kolkata";

/* -------------------------------------------------------------------------- */
/*                               FORMAT HELPERS                               */
/* -------------------------------------------------------------------------- */

/**
 * Format date to ISO string with explicit IST timezone offset
 * THIS IS THE ONLY SAFE WAY - prevents NodeJS from auto-converting to UTC midnight
 */
export const formatDateForServer = (date: Date): string => {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Human readable format (IST)
 */
export const formatForDisplay = (date: Date): string => {
  return formatInTimeZone(date, TIMEZONE, "PPP");
};

/**
 * Input field format (yyyy-MM-dd)
 */
export const formatForInput = (date: Date): string => {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
};

/* -------------------------------------------------------------------------- */
/*                               PARSE HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Parse server date safely
 * - yyyy-MM-dd → treated as IST midnight → converted to UTC
 * - ISO → converted to IST safely
 */
export const parseDateFromServer = (dateString: string): Date => {
  // yyyy-MM-dd (date-only)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const localDate = new Date(`${dateString}T00:00:00`);
    return toZonedTime(localDate, TIMEZONE);
  }

  // ISO string
  return fromZonedTime(new Date(dateString), TIMEZONE);
};

/* -------------------------------------------------------------------------- */
/*                              CURRENT TIME                                  */
/* -------------------------------------------------------------------------- */

/**
 * Current IST date-time (for UI)
 */
export const getLocalDateTime = (): Date => {
  return fromZonedTime(new Date(), TIMEZONE);
};

/**
 * Start of today in IST → returned as UTC (DB safe)
 */
export const getLocalDate = (): Date => {
  const zoned = fromZonedTime(new Date(), TIMEZONE);
  return toZonedTime(startOfDay(zoned), TIMEZONE);
};

/* -------------------------------------------------------------------------- */
/*                             DATE MANIPULATION                              */
/* -------------------------------------------------------------------------- */

/**
 * Add days in IST safely
 * Returns UTC-safe Date
 */
export const addDaysIST = (date: Date, days: number): Date => {
  const zoned = fromZonedTime(date, TIMEZONE);
  const updated = addDays(zoned, days);
  return toZonedTime(updated, TIMEZONE);
};

/**
 * Start of day IST → UTC safe (for DB queries)
 */
export const startOfDayIST = (date: Date): Date => {
  const zoned = fromZonedTime(date, TIMEZONE);
  return toZonedTime(startOfDay(zoned), TIMEZONE);
};

/**
 * End of day IST → UTC safe (for DB queries)
 */
export const endOfDayIST = (date: Date): Date => {
  const zoned = fromZonedTime(date, TIMEZONE);
  return toZonedTime(endOfDay(zoned), TIMEZONE);
};

/* -------------------------------------------------------------------------- */
/*                              COMPARISONS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Compare two dates in IST (ignores time)
 */
export const isSameDayIST = (date1: Date, date2: Date): boolean => {
  const d1 = fromZonedTime(date1, TIMEZONE);
  const d2 = fromZonedTime(date2, TIMEZONE);
  return isSameDay(d1, d2);
};

/**
 * Check if date is today (IST)
 */
export const isToday = (date: Date): boolean => {
  return isSameDayIST(date, new Date());
};

/* -------------------------------------------------------------------------- */
/*                          DB <-> UI CONVERSIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Convert IST (UI) → UTC (DB)
 */
export const dateToUTC = (localDate: Date): Date => {
  return toZonedTime(localDate, TIMEZONE);
};

/**
 * Convert UTC (DB) → IST (UI)
 */
export const dateToIST = (utcDate: Date): Date => {
  return fromZonedTime(utcDate, TIMEZONE);
};

/* -------------------------------------------------------------------------- */
/*                         BACKWARD COMPAT EXPORTS                            */
/* -------------------------------------------------------------------------- */

export { format, startOfDay, endOfDay, addDays, isSameDay };
