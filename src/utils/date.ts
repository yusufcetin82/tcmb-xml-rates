/**
 * Parses user input into a Date object.
 * Supports: Date object, ISO string (YYYY-MM-DD), and DD.MM.YYYY format.
 */
export function normalizeDate(dateInput: Date | string): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === 'string') {
    // Handle DD.MM.YYYY format common in TR
    const trDateMatch = dateInput.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (trDateMatch) {
      const [, day, month, year] = trDateMatch;
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateInput);
  }

  throw new Error('Invalid date format');
}

/**
 * Formats a Date object into TCMB URL parts.
 * TCMB uses YYYYMM/DDMMYYYY.xml format.
 */
export function formatDateForTcmb(date: Date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return {
    year,
    month,
    day,
    path: `${year}${month}/${day}${month}${year}.xml`
  };
}

/**
 * Checks if the given date is today (ignoring time).
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Returns the previous day.
 */
export function getPreviousDay(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(date.getDate() - 1);
  return prev;
}

/**
 * Returns a date formatted as YYYY-MM-DD (ISO partial).
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============= HOURLY RATES DATE UTILITIES =============

import type { TcmbHour } from '../types.js';

/**
 * Valid TCMB hourly rate publication times
 */
export const VALID_HOURS: TcmbHour[] = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

/**
 * Formats a Date and hour into TCMB Reeskont URL path.
 * Example: 2026-01-05, '10:00' -> "202601/05012026-1000.xml"
 */
export function formatDateForHourly(date: Date, hour: TcmbHour): { path: string } {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Remove colon from hour: "10:00" -> "1000"
  const hourNum = hour.replace(':', '');

  return {
    path: `${year}${month}/${day}${month}${year}-${hourNum}.xml`
  };
}

/**
 * Gets the current hour in Istanbul timezone (UTC+3).
 * Returns the hour as a number (0-23).
 */
function getIstanbulHour(): number {
  const now = new Date();
  // Simple UTC+3 calculation for Turkey
  // Note: Turkey doesn't observe DST since 2016, always UTC+3
  return (now.getUTCHours() + 3) % 24;
}

/**
 * Determines the latest available TCMB hourly rate based on current time.
 * TCMB publishes rates at 10:00, 11:00, 12:00, 13:00, 14:00, 15:00 (Istanbul time).
 *
 * Returns the most recent hour that should have data available.
 * - Before 10:00: Returns '15:00' (fallback will go to previous day)
 * - 10:00-10:59: Returns '10:00'
 * - 11:00-11:59: Returns '11:00'
 * - ...
 * - After 15:00: Returns '15:00'
 */
export function getLatestAvailableHour(): TcmbHour {
  const istanbulHour = getIstanbulHour();

  // Before 10:00 - no rates published yet today
  // Return 15:00 so fallback can go to previous business day
  if (istanbulHour < 10) {
    return '15:00';
  }

  // After 15:00 - latest rate is 15:00
  if (istanbulHour >= 15) {
    return '15:00';
  }

  // Between 10:00 and 14:59 - return current hour
  return VALID_HOURS[istanbulHour - 10];
}

/**
 * Gets hours to try in fallback order starting from a given hour.
 * Returns hours in reverse order for fallback (e.g., 14:00 -> [14:00, 13:00, 12:00, 11:00, 10:00])
 */
export function getHoursToTry(startHour: TcmbHour): TcmbHour[] {
  const idx = VALID_HOURS.indexOf(startHour);
  if (idx === -1) {
    // Invalid hour, return all in reverse
    return [...VALID_HOURS].reverse();
  }
  // Return from startHour down to 10:00
  return VALID_HOURS.slice(0, idx + 1).reverse();
}

/**
 * Normalizes hourly XML date format to ISO date.
 * Example: "2026-1-5" -> "2026-01-05"
 */
export function normalizeHourlyDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

