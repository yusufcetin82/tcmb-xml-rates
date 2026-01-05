import { fetchRates, fetchRawXml } from './client.js';
import {
  fetchHourlyRates,
  fetchHourlyRawXml,
  fetchHourlyRate,
  fetchGold,
  fetchSilver,
  fetchPreciousMetals,
  listHourlyCurrencies as fetchListHourlyCurrencies
} from './hourly-client.js';
import {
  TcmbRate,
  GetRatesOptions,
  GetRateOptions,
  ConvertOptions,
  ListCurrenciesOptions,
  GetRawXmlOptions,
  TcmbHourlyRate,
  TcmbPreciousMetalRate,
  GetHourlyRatesOptions,
  GetHourlyRateOptions,
  GetGoldOptions,
  GetHourlyRawXmlOptions
} from './types.js';
import {
  RateNotFoundError,
  InvalidCurrencyCodeError
} from './utils/errors.js';

export * from './types.js';
export * from './utils/errors.js';

/**
 * Fetches exchange rates from TCMB.
 */
export async function getRates(options?: GetRatesOptions): Promise<TcmbRate[]> {
  return fetchRates(options);
}

/**
 * Fetches a single exchange rate for a specific currency.
 */
export async function getRate(
  currencyCode: string, 
  options?: GetRateOptions
): Promise<TcmbRate | null> {
  if (!currencyCode) throw new InvalidCurrencyCodeError('');
  
  const rates = await fetchRates(options);
  const code = currencyCode.toUpperCase();
  return rates.find(r => r.code === code || r.currencyCode === code) || null;
}

/**
 * Converts an amount from one currency to another.
 */
export async function convert(
  amount: number,
  from: string,
  to: string,
  options?: ConvertOptions
): Promise<number> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  if (fromCode === toCode) {
    return amount;
  }

  const rates = await fetchRates(options);

  const getRateValue = (code: string, field: string): number => {
    const rate = rates.find(r => r.code === code || r.currencyCode === code);
    if (!rate) throw new RateNotFoundError(`Currency not found: ${code}`);
    
    const val = (rate as any)[field];
    if (typeof val !== 'number') {
      throw new RateNotFoundError(`Rate field '${field}' is not available for ${code}`);
    }
    return val;
  };

  // Default behaviors if 'use' is not specified:
  // TRY -> X : Bank sells X (ForexSelling)
  // X -> TRY : Bank buys X (ForexBuying)
  // X -> Y   : X -> TRY (Buying), TRY -> Y (Selling)
  
  const use = options?.use;

  if (fromCode === 'TRY') {
    // Converting TRY to Foreign Currency
    // We need the rate of the target currency
    // Default: ForexSelling (Bank Sells Foreign Currency)
    const field = use || 'forexSelling';
    const rateVal = getRateValue(toCode, field);
    return amount / rateVal;
  }

  if (toCode === 'TRY') {
    // Converting Foreign Currency to TRY
    // We need the rate of the source currency
    // Default: ForexBuying (Bank Buys Foreign Currency)
    const field = use || 'forexBuying';
    const rateVal = getRateValue(fromCode, field);
    return amount * rateVal;
  }

  // Cross Currency (X -> Y) via TRY
  // Step 1: X -> TRY
  const fieldForFrom = use || 'forexBuying'; 
  const rateFrom = getRateValue(fromCode, fieldForFrom);
  const amountInTry = amount * rateFrom;

  // Step 2: TRY -> Y
  const fieldForTo = use || 'forexSelling';
  const rateTo = getRateValue(toCode, fieldForTo);
  return amountInTry / rateTo;
}

/**
 * Lists all available currency codes for the given date.
 */
export async function listCurrencies(options?: ListCurrenciesOptions): Promise<string[]> {
  const rates = await fetchRates(options);
  return rates.map(r => r.code);
}

/**
 * Fetches the raw XML string from TCMB.
 */
export async function getRawXml(options?: GetRawXmlOptions): Promise<string> {
  return fetchRawXml(options);
}

// ============= HOURLY RATES API =============

/**
 * Fetches hourly exchange rates from TCMB Reeskont endpoint.
 * Includes gold (XAU), silver (XAS), and major currencies (USD, EUR, GBP, CHF).
 *
 * @param options - Fetch options
 * @returns Array of hourly rates
 *
 * @example
 * ```ts
 * // Get latest available rates
 * const rates = await getHourlyRates();
 *
 * // Get rates for specific hour
 * const rates = await getHourlyRates({ hour: '14:00' });
 *
 * // Get rates for specific date
 * const rates = await getHourlyRates({ date: '2026-01-03' });
 * ```
 */
export async function getHourlyRates(options?: GetHourlyRatesOptions): Promise<TcmbHourlyRate[]> {
  return fetchHourlyRates(options);
}

/**
 * Fetches a single currency's hourly rate.
 *
 * @param currencyCode - Currency code (USD, EUR, XAU, XAS, etc.)
 * @param options - Fetch options
 * @returns Single hourly rate or null if not found
 */
export async function getHourlyRate(
  currencyCode: string,
  options?: GetHourlyRateOptions
): Promise<TcmbHourlyRate | null> {
  return fetchHourlyRate(currencyCode, options);
}

/**
 * Fetches gold (XAU) price from TCMB.
 *
 * @param options - Fetch options
 * @returns Gold rate or null if not available
 *
 * @example
 * ```ts
 * const gold = await getGold();
 * console.log(`Gold: ${gold?.buying} TRY/gram (${gold?.hour})`);
 *
 * // Get gold price for specific hour
 * const gold14 = await getGold({ hour: '14:00' });
 *
 * // Get gold price for specific date
 * const goldYesterday = await getGold({ date: '2026-01-04' });
 * ```
 */
export async function getGold(options?: GetGoldOptions): Promise<TcmbPreciousMetalRate | null> {
  return fetchGold(options);
}

/**
 * Fetches silver (XAS) price from TCMB.
 *
 * @param options - Fetch options
 * @returns Silver rate or null if not available
 *
 * @example
 * ```ts
 * const silver = await getSilver();
 * console.log(`Silver: ${silver?.buying} TRY/gram`);
 * ```
 */
export async function getSilver(options?: GetGoldOptions): Promise<TcmbPreciousMetalRate | null> {
  return fetchSilver(options);
}

/**
 * Fetches both gold and silver prices from TCMB.
 *
 * @param options - Fetch options
 * @returns Object containing gold and silver rates
 *
 * @example
 * ```ts
 * const metals = await getPreciousMetals();
 * console.log(`Gold: ${metals.gold?.buying}, Silver: ${metals.silver?.buying}`);
 * ```
 */
export async function getPreciousMetals(
  options?: GetGoldOptions
): Promise<{ gold: TcmbPreciousMetalRate | null; silver: TcmbPreciousMetalRate | null }> {
  return fetchPreciousMetals(options);
}

/**
 * Lists all available currency codes from hourly rates.
 *
 * @param options - Fetch options
 * @returns Array of currency codes (e.g., ['USD', 'EUR', 'GBP', 'CHF', 'XAU', 'XAS'])
 */
export async function listHourlyCurrencies(options?: GetHourlyRatesOptions): Promise<string[]> {
  return fetchListHourlyCurrencies(options);
}

/**
 * Fetches the raw XML string from TCMB Reeskont endpoint.
 *
 * @param options - Fetch options
 * @returns Raw XML string
 */
export async function getHourlyRawXml(options?: GetHourlyRawXmlOptions): Promise<string> {
  return fetchHourlyRawXml(options);
}

