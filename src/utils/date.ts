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

