import { TcmbRate, GetRatesOptions, RateType } from './types.js';
import { parseTcmbXml } from './parser.js';
import { globalCache } from './utils/cache.js';
import { 
  formatDateForTcmb, 
  normalizeDate, 
  isToday, 
  getPreviousDay, 
  toISODate 
} from './utils/date.js';
import { 
  NetworkError, 
  TcmbResponseError, 
  NoBusinessDayDataError 
} from './utils/errors.js';

const TCMB_BASE_URL = 'https://www.tcmb.gov.tr/kurlar';

export async function fetchRates(options: GetRatesOptions = {}): Promise<TcmbRate[]> {
  const {
    date,
    rateType = 'all',
    fallbackToLastBusinessDay = true,
    signal,
    cache = true
  } = options;

  // Determine initial date and URL construction
  let targetDate = date ? normalizeDate(date) : new Date();
  // If no date provided, we assume "today" logic unless it's explicitly a past date
  const isExplicitDate = !!date;
  
  // Max fallback depth (e.g. 15 days approx 2-3 weeks including holidays)
  const MAX_RETRIES = fallbackToLastBusinessDay ? 15 : 0;
  let retries = 0;
  let lastError: unknown = null;

  while (retries <= MAX_RETRIES) {
    // Determine URL
    let url: string;
    // We use specific date URL if it's an explicit date OR if we are falling back
    // If it's today (and no explicit date provided, or explicitly provided as today) AND we haven't started fallback loop yet
    // Then try today.xml first.
    // However, TCMB logic: 'today.xml' is the same as current date's XML if published. 
    // But safely, let's use date pattern if we are iterating back.
    
    const isTargetToday = isToday(targetDate);

    if (isTargetToday && !isExplicitDate && retries === 0) {
       url = `${TCMB_BASE_URL}/today.xml`;
    } else {
       const { path } = formatDateForTcmb(targetDate);
       url = `${TCMB_BASE_URL}/${path}`;
    }

    // Cache Key: URL + rateType
    // We cache based on URL. Filtering by rateType happens after.
    const cacheKey = `tcmb_rates_${url}`;

    if (cache) {
      const cached = globalCache.get<TcmbRate[]>(cacheKey);
      if (cached) {
        return filterRates(cached, rateType);
      }
    }

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        if (response.status === 404) {
          // Not found, trigger fallback if enabled
          throw new TcmbResponseError(`XML not found at ${url}`, 404);
        }
        throw new TcmbResponseError(`TCMB returned ${response.status} for ${url}`, response.status);
      }

      const xmlText = await response.text();
      const rates = parseTcmbXml(xmlText);

      // Save to cache
      // Today: 5 mins, Past: 24 hours
      const ttl = url.includes('today.xml') ? 300 : 86400;
      if (cache) {
        globalCache.set(cacheKey, rates, ttl);
      }

      return filterRates(rates, rateType);

    } catch (err) {
      lastError = err;
      
      // Check if we should retry (fallback)
      if (fallbackToLastBusinessDay) {
        // Go back one day
        targetDate = getPreviousDay(targetDate);
        retries++;
        // Continue loop
      } else {
        // Fallback disabled, throw error immediately
        if (err instanceof TcmbResponseError && err.statusCode === 404) {
           throw new NoBusinessDayDataError(`No data found for ${toISODate(targetDate)} and fallback is disabled.`);
        }
        throw new NetworkError(`Failed to fetch rates from ${url}`, err);
      }
    }
  }

  // If we exited loop without returning, it means we ran out of retries
  throw new NoBusinessDayDataError(
    `Could not find any rate data within last ${MAX_RETRIES} days. Last error: ${(lastError as Error)?.message}`
  );
}

function filterRates(rates: TcmbRate[], type: RateType): TcmbRate[] {
  if (type === 'all') return rates;

  return rates.filter(rate => {
    if (type === 'forex') {
      return rate.forexBuying !== null || rate.forexSelling !== null;
    }
    if (type === 'banknote') {
      return rate.banknoteBuying !== null || rate.banknoteSelling !== null;
    }
    return true;
  });
}

export async function fetchRawXml(options: GetRatesOptions = {}): Promise<string> {
   // Simplification for raw XML fetching, mainly for debug
   // Does not support complex fallback logic as elegantly as getRates, 
   // or we could reuse logic but we just want the string.
   // For v1, let's implement simple fetch.
   const { date, signal } = options;
   const targetDate = date ? normalizeDate(date) : new Date();
   
   let url: string;
   if (isToday(targetDate) && !date) {
      url = `${TCMB_BASE_URL}/today.xml`;
   } else {
      const { path } = formatDateForTcmb(targetDate);
      url = `${TCMB_BASE_URL}/${path}`;
   }

   try {
     const res = await fetch(url, { signal });
     if (!res.ok) throw new TcmbResponseError(res.statusText, res.status);
     return await res.text();
   } catch (err) {
     throw new NetworkError(`Failed to fetch raw XML from ${url}`, err);
   }
}

