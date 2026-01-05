/**
 * HTTP client for TCMB Reeskont/Hourly rates endpoint.
 * Includes caching, hour fallback, and business day fallback logic.
 */

import {
  TcmbHourlyRate,
  TcmbPreciousMetalRate,
  TcmbHour,
  GetHourlyRatesOptions,
  GetHourlyRateOptions,
  GetGoldOptions,
  GetHourlyRawXmlOptions
} from './types.js';
import { parseHourlyXml } from './hourly-parser.js';
import { globalCache } from './utils/cache.js';
import {
  normalizeDate,
  getPreviousDay,
  formatDateForHourly,
  getLatestAvailableHour,
  getHoursToTry,
  isToday
} from './utils/date.js';
import {
  NetworkError,
  TcmbResponseError,
  NoBusinessDayDataError,
  InvalidCurrencyCodeError
} from './utils/errors.js';

const TCMB_HOURLY_BASE_URL = 'https://www.tcmb.gov.tr/reeskontkur';

/**
 * Maximum number of days to try when falling back to previous business days.
 * Covers approximately 2-3 weeks including potential long holidays.
 */
const MAX_DAY_RETRIES = 15;

/**
 * Cache TTL values (in seconds)
 */
const CACHE_TTL = {
  CURRENT_HOUR: 120,      // 2 minutes for current hour (may update)
  PAST_HOUR: 3600,        // 1 hour for past hours today (won't change)
  PAST_DAY: 86400         // 24 hours for past days (definitely won't change)
};

/**
 * Fetches hourly rates from TCMB Reeskont endpoint.
 *
 * @param options - Fetch options
 * @returns Array of hourly rates
 *
 * @example
 * ```ts
 * // Get latest available rates
 * const rates = await fetchHourlyRates();
 *
 * // Get rates for specific hour
 * const rates = await fetchHourlyRates({ hour: '14:00' });
 *
 * // Get rates for specific date
 * const rates = await fetchHourlyRates({ date: '2026-01-03' });
 * ```
 */
export async function fetchHourlyRates(options: GetHourlyRatesOptions = {}): Promise<TcmbHourlyRate[]> {
  const {
    date,
    hour = 'latest',
    fallbackToLastBusinessDay = true,
    fallbackToPreviousHour = true,
    signal,
    cache = true
  } = options;

  // Determine initial target date
  let targetDate = date ? normalizeDate(date) : new Date();
  const isTargetToday = isToday(targetDate);

  // Determine initial target hour
  let targetHour: TcmbHour = hour === 'latest' ? getLatestAvailableHour() : hour;

  // Fallback loop variables
  const maxDayRetries = fallbackToLastBusinessDay ? MAX_DAY_RETRIES : 0;
  let dayRetries = 0;
  let lastError: unknown = null;

  while (dayRetries <= maxDayRetries) {
    // Determine hours to try for this day
    const hoursToTry = fallbackToPreviousHour
      ? getHoursToTry(targetHour)
      : [targetHour];

    for (const tryHour of hoursToTry) {
      const { path } = formatDateForHourly(targetDate, tryHour);
      const url = `${TCMB_HOURLY_BASE_URL}/${path}`;
      const cacheKey = `tcmb_hourly_${url}`;

      // Check cache first
      if (cache) {
        const cached = globalCache.get<TcmbHourlyRate[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      try {
        const response = await fetch(url, { signal });

        if (!response.ok) {
          if (response.status === 404) {
            // Not found, try next hour or day
            lastError = new TcmbResponseError(`XML not found at ${url}`, 404);
            continue;
          }
          throw new TcmbResponseError(`TCMB returned ${response.status} for ${url}`, response.status);
        }

        const xmlText = await response.text();
        const rates = parseHourlyXml(xmlText);

        // Determine cache TTL based on data freshness
        if (cache) {
          const ttl = determineCacheTtl(targetDate, tryHour, isTargetToday);
          globalCache.set(cacheKey, rates, ttl);
        }

        return rates;

      } catch (err) {
        lastError = err;

        // If it's a 404, continue to next hour/day
        if (err instanceof TcmbResponseError && err.statusCode === 404) {
          continue;
        }

        // For other errors, throw immediately if fallback is disabled
        if (!fallbackToLastBusinessDay) {
          throw new NetworkError(`Failed to fetch hourly rates from ${url}`, err);
        }
      }
    }

    // All hours exhausted for this day, try previous day
    if (fallbackToLastBusinessDay && dayRetries < maxDayRetries) {
      targetDate = getPreviousDay(targetDate);
      targetHour = '15:00'; // Start from latest hour for previous days
      dayRetries++;
    } else {
      break;
    }
  }

  // No data found after all retries
  throw new NoBusinessDayDataError(
    `Could not find hourly rate data within last ${maxDayRetries} days. ` +
    `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

/**
 * Determines the appropriate cache TTL based on data freshness.
 */
function determineCacheTtl(targetDate: Date, hour: TcmbHour, isTargetToday: boolean): number {
  if (!isTargetToday) {
    // Past day data won't change
    return CACHE_TTL.PAST_DAY;
  }

  const currentHour = getLatestAvailableHour();
  if (hour === currentHour) {
    // Current hour might still be updating
    return CACHE_TTL.CURRENT_HOUR;
  }

  // Past hour today - won't change but keep shorter than past day
  return CACHE_TTL.PAST_HOUR;
}

/**
 * Fetches raw XML from TCMB Reeskont endpoint.
 *
 * @param options - Fetch options
 * @returns Raw XML string
 */
export async function fetchHourlyRawXml(options: GetHourlyRawXmlOptions = {}): Promise<string> {
  const { date, hour = 'latest', signal } = options;

  const targetDate = date ? normalizeDate(date) : new Date();
  const targetHour: TcmbHour = hour === 'latest' ? getLatestAvailableHour() : hour;

  const { path } = formatDateForHourly(targetDate, targetHour);
  const url = `${TCMB_HOURLY_BASE_URL}/${path}`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new TcmbResponseError(`TCMB returned ${response.status}`, response.status);
    }

    return await response.text();
  } catch (err) {
    if (err instanceof TcmbResponseError) {
      throw err;
    }
    throw new NetworkError(`Failed to fetch hourly raw XML from ${url}`, err);
  }
}

/**
 * Fetches a single currency's hourly rate.
 *
 * @param currencyCode - Currency code (USD, EUR, XAU, XAS, etc.)
 * @param options - Fetch options
 * @returns Single hourly rate or null if not found
 */
export async function fetchHourlyRate(
  currencyCode: string,
  options?: GetHourlyRateOptions
): Promise<TcmbHourlyRate | null> {
  if (!currencyCode) {
    throw new InvalidCurrencyCodeError('');
  }

  const rates = await fetchHourlyRates(options);
  const code = currencyCode.toUpperCase();

  return rates.find(r => r.code === code || r.currencyCode === code) || null;
}

/**
 * Fetches gold (XAU) price from TCMB.
 *
 * @param options - Fetch options
 * @returns Gold rate or null if not available
 *
 * @example
 * ```ts
 * const gold = await fetchGold();
 * console.log(`Gold: ${gold?.buying} TRY/gram`);
 * ```
 */
export async function fetchGold(options?: GetGoldOptions): Promise<TcmbPreciousMetalRate | null> {
  const rate = await fetchHourlyRate('XAU', options);

  if (!rate) {
    return null;
  }

  return {
    code: 'XAU',
    name: rate.name,
    nameEn: rate.nameEn,
    unit: rate.unit,
    buying: rate.buying,
    date: rate.date,
    hour: rate.hour,
    timestamp: rate.timestamp
  };
}

/**
 * Fetches silver (XAS) price from TCMB.
 *
 * @param options - Fetch options
 * @returns Silver rate or null if not available
 */
export async function fetchSilver(options?: GetGoldOptions): Promise<TcmbPreciousMetalRate | null> {
  const rate = await fetchHourlyRate('XAS', options);

  if (!rate) {
    return null;
  }

  return {
    code: 'XAS',
    name: rate.name,
    nameEn: rate.nameEn,
    unit: rate.unit,
    buying: rate.buying,
    date: rate.date,
    hour: rate.hour,
    timestamp: rate.timestamp
  };
}

/**
 * Fetches both gold and silver prices from TCMB.
 *
 * @param options - Fetch options
 * @returns Object containing gold and silver rates
 *
 * @example
 * ```ts
 * const metals = await fetchPreciousMetals();
 * console.log(`Gold: ${metals.gold?.buying}, Silver: ${metals.silver?.buying}`);
 * ```
 */
export async function fetchPreciousMetals(
  options?: GetGoldOptions
): Promise<{ gold: TcmbPreciousMetalRate | null; silver: TcmbPreciousMetalRate | null }> {
  const rates = await fetchHourlyRates(options);

  const goldRate = rates.find(r => r.code === 'XAU');
  const silverRate = rates.find(r => r.code === 'XAS');

  const toMetal = (
    rate: TcmbHourlyRate | undefined,
    code: 'XAU' | 'XAS'
  ): TcmbPreciousMetalRate | null => {
    if (!rate) return null;

    return {
      code,
      name: rate.name,
      nameEn: rate.nameEn,
      unit: rate.unit,
      buying: rate.buying,
      date: rate.date,
      hour: rate.hour,
      timestamp: rate.timestamp
    };
  };

  return {
    gold: toMetal(goldRate, 'XAU'),
    silver: toMetal(silverRate, 'XAS')
  };
}

/**
 * Lists all available currency codes from hourly rates.
 *
 * @param options - Fetch options
 * @returns Array of currency codes
 */
export async function listHourlyCurrencies(options?: GetHourlyRatesOptions): Promise<string[]> {
  const rates = await fetchHourlyRates(options);
  return rates.map(r => r.code);
}
